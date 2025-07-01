package main

import (
	"log"

	"github.com/DodoroGit/Cake_Store/database"
	"github.com/DodoroGit/Cake_Store/graph"
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

	// 初始化資料庫
	database.InitDB()

	// 初始化 GraphQL schema
	graph.InitSchema()

	// 註冊 GraphQL endpoint
	r.Any("/graphql", routes.GraphqlHandler())

	// 啟動 server
	r.Run(":8080")
}
