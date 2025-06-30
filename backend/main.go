package main

import (
	"github.com/DodoroGit/Cake_Store/database"
	"github.com/DodoroGit/Cake_Store/graph"
	"github.com/DodoroGit/Cake_Store/routes"
	"github.com/gin-gonic/gin"
)

func main() {
	r := gin.Default()
	database.InitDB()

	// 初始化 GraphQL schema
	graph.InitSchema()

	// 註冊 GraphQL endpoint
	r.Any("/graphql", routes.GraphqlHandler())

	r.Run(":8080") // 啟動在 localhost:8080
}
