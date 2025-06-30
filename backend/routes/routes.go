package routes

import (
	"github.com/DodoroGit/Cake_Store/graph"
	"github.com/DodoroGit/Cake_Store/middlewares"
	"github.com/gin-gonic/gin"
	"github.com/graphql-go/handler"
)

func GraphqlHandler() gin.HandlerFunc {
	h := handler.New(&handler.Config{
		Schema:   &graph.Schema,
		Pretty:   true,
		GraphiQL: true,
	})

	return func(c *gin.Context) {
		middlewares.JWTMiddleware()(c) // ✅ 加入 JWT middleware
		h.ServeHTTP(c.Writer, c.Request)
	}
}
