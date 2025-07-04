package resolver

import (
	"errors"

	"github.com/DodoroGit/Cake_Store/database"
	"github.com/DodoroGit/Cake_Store/middlewares"
	"github.com/graphql-go/graphql"
)

// ✅ 先定義 QueryType 為空的 graphql.Object
var QueryType = graphql.NewObject(graphql.ObjectConfig{
	Name:   "Query",
	Fields: graphql.Fields{}, // 先空的，下面再加
})

// ✅ 在 init 裡用 AddFieldConfig 補上 me/hello
func init() {
	QueryType.AddFieldConfig("hello", &graphql.Field{
		Type: graphql.String,
		Resolve: func(p graphql.ResolveParams) (interface{}, error) {
			return "world", nil
		},
	})

	QueryType.AddFieldConfig("me", &graphql.Field{
		Type: graphql.String,
		Resolve: func(p graphql.ResolveParams) (interface{}, error) {
			userID, ok := middlewares.GetUserIDFromContext(p.Context)
			if !ok {
				return nil, errors.New("未登入")
			}
			return "你的 User ID 是：" + string(rune(userID)), nil
		},
	})
	QueryType.AddFieldConfig("myOrders", &graphql.Field{
		Type: graphql.NewList(OrderType),
		Resolve: func(p graphql.ResolveParams) (interface{}, error) {
			userID, ok := GetUserIDFromParams(p)
			if !ok {
				return nil, errors.New("未登入")
			}

			rows, err := database.DB.Query(
				`SELECT id, created_at, status FROM orders WHERE user_id=$1 ORDER BY created_at DESC`, userID)
			if err != nil {
				return nil, err
			}
			defer rows.Close()

			var result []map[string]interface{}

			for rows.Next() {
				var id int
				var createdAt string
				var status string
				if err := rows.Scan(&id, &createdAt, &status); err != nil {
					continue
				}

				// 查詢此訂單的項目
				itemRows, _ := database.DB.Query(`
				SELECT p.name, oi.quantity, oi.price
				FROM order_items oi
				JOIN products p ON p.id = oi.product_id
				WHERE oi.order_id=$1`, id)

				var items []map[string]interface{}
				for itemRows.Next() {
					var name string
					var quantity int
					var price float64
					itemRows.Scan(&name, &quantity, &price)
					items = append(items, map[string]interface{}{
						"productName": name,
						"quantity":    quantity,
						"price":       price,
					})
				}
				itemRows.Close()

				result = append(result, map[string]interface{}{
					"id":        id,
					"createdAt": createdAt,
					"status":    status,
					"items":     items,
				})
			}
			return result, nil
		},
	})

	QueryType.AddFieldConfig("meInfo", &graphql.Field{
		Type: graphql.NewObject(graphql.ObjectConfig{
			Name: "MeInfo",
			Fields: graphql.Fields{
				"email": &graphql.Field{Type: graphql.String},
				"phone": &graphql.Field{Type: graphql.String},
				"role":  &graphql.Field{Type: graphql.String},
			},
		}),
		Resolve: func(p graphql.ResolveParams) (interface{}, error) {
			userID, ok := GetUserIDFromParams(p)
			if !ok {
				return nil, errors.New("未登入")
			}

			row := database.DB.QueryRow(`SELECT email, phone, role FROM users WHERE id=$1`, userID)
			var email, phone, role string
			if err := row.Scan(&email, &phone, &role); err != nil {
				return nil, err
			}

			return map[string]interface{}{
				"email": email,
				"phone": phone,
				"role":  role,
			}, nil
		},
	})

	QueryType.AddFieldConfig("products", &graphql.Field{
		Type: graphql.NewList(graphql.NewObject(graphql.ObjectConfig{
			Name: "Product",
			Fields: graphql.Fields{
				"id":          &graphql.Field{Type: graphql.Int},
				"name":        &graphql.Field{Type: graphql.String},
				"description": &graphql.Field{Type: graphql.String},
				"price":       &graphql.Field{Type: graphql.Float},
				"imageUrl":    &graphql.Field{Type: graphql.String},
			},
		})),
		Resolve: func(p graphql.ResolveParams) (interface{}, error) {
			rows, err := database.DB.Query(`SELECT id, name, description, price, image_url FROM products`)
			if err != nil {
				return nil, err
			}
			defer rows.Close()

			var result []map[string]interface{}
			for rows.Next() {
				var id int
				var name, desc, image string
				var price float64
				rows.Scan(&id, &name, &desc, &price, &image)
				result = append(result, map[string]interface{}{
					"id":          id,
					"name":        name,
					"description": desc,
					"price":       price,
					"imageUrl":    image,
				})
			}
			return result, nil
		},
	})

}
