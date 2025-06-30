package middlewares

import (
	"context"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
)

var JwtSecret = []byte("secret123") // 與登入時一致

func JWTMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" || !strings.HasPrefix(authHeader, "Bearer ") {
			c.Next()
			return
		}

		tokenString := strings.TrimPrefix(authHeader, "Bearer ")

		token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
			return JwtSecret, nil
		})

		if err == nil && token.Valid {
			if claims, ok := token.Claims.(jwt.MapClaims); ok {
				userID := int(claims["userID"].(float64))
				ctx := context.WithValue(c.Request.Context(), "userID", userID)
				c.Request = c.Request.WithContext(ctx)
			}
		}

		c.Next()
	}
}

// 工具函式：取出 userID
func GetUserIDFromContext(ctx context.Context) (int, bool) {
	id, ok := ctx.Value("userID").(int)
	return id, ok
}
