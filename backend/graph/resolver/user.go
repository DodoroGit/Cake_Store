package resolver

import (
	"database/sql"
	"errors"
	"time"

	"github.com/DodoroGit/Cake_Store/database"
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
				"email":    &graphql.ArgumentConfig{Type: graphql.NewNonNull(graphql.String)},
				"password": &graphql.ArgumentConfig{Type: graphql.NewNonNull(graphql.String)},
				"phone":    &graphql.ArgumentConfig{Type: graphql.NewNonNull(graphql.String)},
			},
			Resolve: func(p graphql.ResolveParams) (interface{}, error) {
				email := p.Args["email"].(string)
				password := p.Args["password"].(string)
				phone := p.Args["phone"].(string)

				_, err := database.DB.Exec(
					`INSERT INTO users (email, password, phone) VALUES ($1, $2, $3)`,
					email, password, phone,
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
	},
})
