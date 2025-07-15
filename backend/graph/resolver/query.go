package resolver

import (
	"database/sql"
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

			rows, err := database.DB.Query(`
				SELECT id, created_at, status, pickup_date, order_number, pickup_method, address, pickup_time, payment_info
				FROM orders
				WHERE user_id=$1
				ORDER BY created_at DESC
			`, userID)
			if err != nil {
				return nil, err
			}
			defer rows.Close()

			var result []map[string]interface{}

			for rows.Next() {
				var id int
				var createdAt, status, orderNumber, pickupMethod, address, pickupTime string
				var pickupDate sql.NullString
				var paymentInfo sql.NullString

				err := rows.Scan(&id, &createdAt, &status, &pickupDate, &orderNumber, &pickupMethod, &address, &pickupTime, &paymentInfo)
				if err != nil {
					continue
				}

				itemRows, _ := database.DB.Query(`
					SELECT p.name, oi.quantity, oi.price
					FROM order_items oi
					JOIN products p ON p.id = oi.product_id
					WHERE oi.order_id=$1
				`, id)

				var items []map[string]interface{}
				var total float64

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
					total += price * float64(quantity)
				}
				itemRows.Close()

				result = append(result, map[string]interface{}{
					"id":           id,
					"createdAt":    createdAt,
					"status":       status,
					"pickupDate":   pickupDate.String,
					"orderNumber":  orderNumber,
					"pickupMethod": pickupMethod,
					"address":      address,
					"pickupTime":   pickupTime,
					"totalAmount":  total,
					"items":        items,
					"paymentInfo":  paymentInfo.String,
				})
			}

			return result, nil
		},
	})

	QueryType.AddFieldConfig("meInfo", &graphql.Field{
		Type: graphql.NewObject(graphql.ObjectConfig{
			Name: "MeInfo",
			Fields: graphql.Fields{
				"name":  &graphql.Field{Type: graphql.String},
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

			row := database.DB.QueryRow(`SELECT name, email, phone, role FROM users WHERE id=$1`, userID)
			var name, email, phone, role string
			if err := row.Scan(&name, &email, &phone, &role); err != nil {
				return nil, err
			}

			if role == "user" {
				role = "一般會員"
			}

			return map[string]interface{}{
				"name":  name,
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
	QueryType.AddFieldConfig("allOrders", &graphql.Field{
		Type: graphql.NewList(OrderType),
		Args: graphql.FieldConfigArgument{
			"month": &graphql.ArgumentConfig{Type: graphql.String}, // 新增月份參數
		},
		Resolve: func(p graphql.ResolveParams) (interface{}, error) {
			userID, ok := GetUserIDFromParams(p)
			if !ok {
				return nil, errors.New("未登入")
			}

			var role string
			err := database.DB.QueryRow(`SELECT role FROM users WHERE id=$1`, userID).Scan(&role)
			if err != nil || role != "admin" {
				return nil, errors.New("沒有權限")
			}

			baseQuery := `
				SELECT o.id, o.created_at, o.status, o.pickup_date, o.order_number, o.pickup_method, o.address, o.pickup_time, u.name
				FROM orders o
				JOIN users u ON o.user_id = u.id
			`
			args := []interface{}{}
			if month, ok := p.Args["month"].(string); ok && month != "" {
				baseQuery += " WHERE TO_CHAR(o.pickup_date, 'YYYY-MM') = $1"
				args = append(args, month)
			}
			baseQuery += " ORDER BY created_at DESC"

			rows, err := database.DB.Query(baseQuery, args...)
			if err != nil {
				return nil, err
			}
			defer rows.Close()

			var result []map[string]interface{}

			for rows.Next() {
				var id int
				var createdAt, status, orderNumber, pickupMethod, address, pickupTime, userName string
				var pickupDate sql.NullString

				err := rows.Scan(&id, &createdAt, &status, &pickupDate, &orderNumber, &pickupMethod, &address, &pickupTime, &userName)
				if err != nil {
					continue
				}

				itemRows, _ := database.DB.Query(`
				SELECT p.name, oi.quantity, oi.price
				FROM order_items oi
				JOIN products p ON p.id = oi.product_id
				WHERE oi.order_id=$1
			`, id)

				var items []map[string]interface{}
				var total float64

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
					total += price * float64(quantity)
				}
				itemRows.Close()

				result = append(result, map[string]interface{}{
					"id":           id,
					"createdAt":    createdAt,
					"status":       status,
					"pickupDate":   pickupDate.String,
					"orderNumber":  orderNumber,
					"pickupMethod": pickupMethod,
					"address":      address,
					"pickupTime":   pickupTime,
					"totalAmount":  total,
					"items":        items,
					"name":         userName,
				})
			}

			return result, nil
		},
	})

}
