package routes

import (
	"net/http"

	"github.com/DodoroGit/Cake_Store/graph"
	"github.com/gin-gonic/gin"
	"github.com/graphql-go/graphql"
)

type GraphQLRequest struct {
	Query string `json:"query"`
}

func GraphqlHandler() gin.HandlerFunc {
	return func(c *gin.Context) {
		var req GraphQLRequest
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "無效的請求"})
			return
		}

		result := graphql.Do(graphql.Params{
			Schema:        graph.Schema,
			RequestString: req.Query,
			Context:       c.Request.Context(), // ✅ 重點：帶入 Middleware 設定的 context
		})

		c.JSON(http.StatusOK, result)
	}
}
