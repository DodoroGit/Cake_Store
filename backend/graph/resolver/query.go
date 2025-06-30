package resolver

import (
	"errors"

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
}
