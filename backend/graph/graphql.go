package graph

import (
	"github.com/DodoroGit/Cake_Store/graph/resolver"
	"github.com/graphql-go/graphql"
)

var Schema graphql.Schema

func InitSchema() {
	Schema, _ = graphql.NewSchema(graphql.SchemaConfig{
		Query:    resolver.QueryType,
		Mutation: resolver.MutationType,
	})
}
