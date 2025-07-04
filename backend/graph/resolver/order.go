package resolver

import "github.com/graphql-go/graphql"

var OrderItemType = graphql.NewObject(graphql.ObjectConfig{
	Name: "OrderItem",
	Fields: graphql.Fields{
		"productName": &graphql.Field{Type: graphql.String},
		"quantity":    &graphql.Field{Type: graphql.Int},
		"price":       &graphql.Field{Type: graphql.Float},
	},
})

var OrderType = graphql.NewObject(graphql.ObjectConfig{
	Name: "Order",
	Fields: graphql.Fields{
		"id":        &graphql.Field{Type: graphql.Int},
		"createdAt": &graphql.Field{Type: graphql.String},
		"status":    &graphql.Field{Type: graphql.String},
		"items":     &graphql.Field{Type: graphql.NewList(OrderItemType)},
	},
})
