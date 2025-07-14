package resolver

import (
	"database/sql"
	"errors"
	"fmt"
	"time"

	"github.com/DodoroGit/Cake_Store/database"
	"github.com/DodoroGit/Cake_Store/middlewares"
	"github.com/DodoroGit/Cake_Store/models"
	"github.com/golang-jwt/jwt/v5"
	"github.com/graphql-go/graphql"
)

var jwtSecret = []byte("secret123")

var MutationType = graphql.NewObject(graphql.ObjectConfig{
	Name: "Mutation",
	Fields: graphql.Fields{
		"register": &graphql.Field{
			Type:        graphql.String,
			Description: "註冊帳號",
			Args: graphql.FieldConfigArgument{
				"name":     &graphql.ArgumentConfig{Type: graphql.NewNonNull(graphql.String)},
				"email":    &graphql.ArgumentConfig{Type: graphql.NewNonNull(graphql.String)},
				"password": &graphql.ArgumentConfig{Type: graphql.NewNonNull(graphql.String)},
				"phone":    &graphql.ArgumentConfig{Type: graphql.NewNonNull(graphql.String)},
			},
			Resolve: func(p graphql.ResolveParams) (interface{}, error) {
				name := p.Args["name"].(string)
				email := p.Args["email"].(string)
				password := p.Args["password"].(string)
				phone := p.Args["phone"].(string)

				_, err := database.DB.Exec(
					`INSERT INTO users (name, email, password, phone) VALUES ($1, $2, $3, $4)`,
					name, email, password, phone,
				)

				if err != nil {
					return nil, errors.New("註冊失敗，帳號可能已存在")
				}
				return "註冊成功", nil
			},
		},

		"login": &graphql.Field{
			Type:        graphql.String,
			Description: "登入帳號並回傳 JWT",
			Args: graphql.FieldConfigArgument{
				"email":    &graphql.ArgumentConfig{Type: graphql.NewNonNull(graphql.String)},
				"password": &graphql.ArgumentConfig{Type: graphql.NewNonNull(graphql.String)},
			},
			Resolve: func(p graphql.ResolveParams) (interface{}, error) {
				email := p.Args["email"].(string)
				password := p.Args["password"].(string)

				var user models.User
				err := database.DB.QueryRow(
					`SELECT id, email, password, phone FROM users WHERE email=$1`,
					email,
				).Scan(&user.ID, &user.Email, &user.Password, &user.Phone)

				if err != nil {
					if err == sql.ErrNoRows {
						return nil, errors.New("帳號不存在")
					}
					return nil, err
				}

				if user.Password != password {
					return nil, errors.New("密碼錯誤")
				}

				// 產生 JWT
				token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
					"userID": user.ID,
					"exp":    time.Now().Add(72 * time.Hour).Unix(),
				})
				tokenString, _ := token.SignedString(jwtSecret)
				return tokenString, nil
			},
		},
		"createOrder": &graphql.Field{
			Type:        graphql.String,
			Description: "建立一筆訂單",
			Args: graphql.FieldConfigArgument{
				"items": &graphql.ArgumentConfig{
					Type: graphql.NewList(graphql.NewInputObject(graphql.InputObjectConfig{
						Name: "OrderItemInput",
						Fields: graphql.InputObjectConfigFieldMap{
							"productID": &graphql.InputObjectFieldConfig{Type: graphql.NewNonNull(graphql.Int)},
							"quantity":  &graphql.InputObjectFieldConfig{Type: graphql.NewNonNull(graphql.Int)},
						},
					})),
				},
				"pickupDate":   &graphql.ArgumentConfig{Type: graphql.NewNonNull(graphql.String)},
				"pickupMethod": &graphql.ArgumentConfig{Type: graphql.NewNonNull(graphql.String)},
				"pickupTime":   &graphql.ArgumentConfig{Type: graphql.NewNonNull(graphql.String)},
				"address":      &graphql.ArgumentConfig{Type: graphql.NewNonNull(graphql.String)},
			},
			Resolve: func(p graphql.ResolveParams) (interface{}, error) {
				userID, ok := GetUserIDFromParams(p)
				if !ok {
					return nil, errors.New("未登入")
				}

				pickupDateStr := p.Args["pickupDate"].(string)
				pickupMethod := p.Args["pickupMethod"].(string)
				pickupTime := p.Args["pickupTime"].(string)
				address := p.Args["address"].(string)
				items := p.Args["items"].([]interface{})

				// 驗證時間
				if pickupMethod == "現場取貨" {
					if address == "" {
						address = "新竹市東區明湖路233號"
					}
					t, err := time.Parse("15:04", pickupTime)
					if err != nil || t.Hour() < 15 || t.Hour() > 23 {
						return nil, errors.New("現場取貨時間需為 15:00~24:00")
					}
				}

				// 產生訂單編號
				orderNumber := fmt.Sprintf("ODR-%d-%s", userID, time.Now().Format("20060102150405"))

				tx, err := database.DB.Begin()
				if err != nil {
					return nil, err
				}

				// 寫入 orders 表
				var orderID int
				err = tx.QueryRow(`
			INSERT INTO orders (user_id, pickup_date, pickup_method, address, pickup_time, order_number) 
			VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
					userID, pickupDateStr, pickupMethod, address, pickupTime, orderNumber,
				).Scan(&orderID)
				if err != nil {
					tx.Rollback()
					return nil, err
				}

				// 寫入 order_items
				for _, i := range items {
					item := i.(map[string]interface{})
					productID := item["productID"].(int)
					quantity := item["quantity"].(int)

					var price float64
					err := tx.QueryRow(`SELECT price FROM products WHERE id=$1`, productID).Scan(&price)
					if err != nil {
						tx.Rollback()
						return nil, errors.New("商品不存在")
					}

					_, err = tx.Exec(`
				INSERT INTO order_items (order_id, product_id, quantity, price) 
				VALUES ($1, $2, $3, $4)`,
						orderID, productID, quantity, price,
					)
					if err != nil {
						tx.Rollback()
						return nil, err
					}
				}

				tx.Commit()
				return fmt.Sprintf("訂單建立成功，訂單編號：%s", orderNumber), nil
			},
		},

		"createProduct": &graphql.Field{
			Type:        graphql.String,
			Description: "新增商品",
			Args: graphql.FieldConfigArgument{
				"name":        &graphql.ArgumentConfig{Type: graphql.NewNonNull(graphql.String)},
				"description": &graphql.ArgumentConfig{Type: graphql.String},
				"price":       &graphql.ArgumentConfig{Type: graphql.NewNonNull(graphql.Float)},
				"imageUrl":    &graphql.ArgumentConfig{Type: graphql.String},
			},
			Resolve: func(p graphql.ResolveParams) (interface{}, error) {
				name := p.Args["name"].(string)
				description, _ := p.Args["description"].(string)
				price := p.Args["price"].(float64)
				imageUrl, _ := p.Args["imageUrl"].(string)

				_, err := database.DB.Exec(`
					INSERT INTO products (name, description, price, image_url)
					VALUES ($1, $2, $3, $4)
				`, name, description, price, imageUrl)

				if err != nil {
					return nil, err
				}
				return "商品新增成功", nil
			},
		},

		"updateMe": &graphql.Field{
			Type:        graphql.String,
			Description: "修改會員基本資料",
			Args: graphql.FieldConfigArgument{
				"name":  &graphql.ArgumentConfig{Type: graphql.String},
				"email": &graphql.ArgumentConfig{Type: graphql.String},
				"phone": &graphql.ArgumentConfig{Type: graphql.String},
			},
			Resolve: func(p graphql.ResolveParams) (interface{}, error) {
				userID, ok := GetUserIDFromParams(p)
				if !ok {
					return nil, errors.New("未登入")
				}
				// 動態組合更新欄位
				query := "UPDATE users SET"
				args := []interface{}{}
				i := 1

				if name, ok := p.Args["name"].(string); ok {
					query += fmt.Sprintf(" name=$%d,", i)
					args = append(args, name)
					i++
				}
				if email, ok := p.Args["email"].(string); ok {
					query += fmt.Sprintf(" email=$%d,", i)
					args = append(args, email)
					i++
				}
				if phone, ok := p.Args["phone"].(string); ok {
					query += fmt.Sprintf(" phone=$%d,", i)
					args = append(args, phone)
					i++
				}
				if len(args) == 0 {
					return nil, errors.New("未提供任何要更新的欄位")
				}
				query = query[:len(query)-1] // 移除最後的逗號
				query += fmt.Sprintf(" WHERE id=$%d", i)
				args = append(args, userID)

				_, err := database.DB.Exec(query, args...)
				if err != nil {
					return nil, err
				}
				return "會員資料已更新", nil
			},
		},
		"updateOrderStatus": &graphql.Field{
			Type: graphql.String,
			Args: graphql.FieldConfigArgument{
				"orderId": &graphql.ArgumentConfig{Type: graphql.NewNonNull(graphql.Int)},
				"status":  &graphql.ArgumentConfig{Type: graphql.NewNonNull(graphql.String)},
			},
			Resolve: func(p graphql.ResolveParams) (interface{}, error) {
				userID, ok := GetUserIDFromParams(p)
				if !ok {
					return nil, errors.New("未登入")
				}
				// 檢查角色
				var role string
				err := database.DB.QueryRow(`SELECT role FROM users WHERE id=$1`, userID).Scan(&role)
				if err != nil || role != "admin" {
					return nil, errors.New("無權限")
				}

				orderId := p.Args["orderId"].(int)
				status := p.Args["status"].(string)

				_, err = database.DB.Exec(`UPDATE orders SET status=$1 WHERE id=$2`, status, orderId)
				if err != nil {
					return nil, err
				}
				return "OK", nil
			},
		},
	},
})

func GetUserIDFromParams(p graphql.ResolveParams) (int, bool) {
	return middlewares.GetUserIDFromContext(p.Context)
}
