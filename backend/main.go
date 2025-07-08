package main

import (
	"log"

	"github.com/DodoroGit/Cake_Store/database"
	"github.com/DodoroGit/Cake_Store/graph"
	"github.com/DodoroGit/Cake_Store/middlewares"
	"github.com/DodoroGit/Cake_Store/routes"
	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
)

func main() {
	// 載入 .env 環境變數
	err := godotenv.Load()
	if err != nil {
		log.Fatal("❌ 無法讀取 .env 檔案")
	}

	r := gin.Default()

	// ✅ 啟用 JWT Middleware 全域作用
	r.Use(middlewares.JWTMiddleware())

	// 初始化資料庫與 GraphQL schema
	database.InitDB()
	graph.InitSchema()

	// 註冊 GraphQL endpoint（此時 context 已含 JWT）
	r.Any("/graphql", routes.GraphqlHandler())

	// 啟動 server
	r.Run("0.0.0.0:8080")
}
