# NestJS Microservices Project

## Overview

This project is a monorepo microservices-based system developed with NestJS, designed for processing and managing orders. It includes several services responsible for different aspects of order management, stock processing, notifications, and email communication.

post to api for create order => emit created order event to a broker => order processing service is listening to new orders : validate it and check ingredients and send event to notification service to notify merchant about below 50 % => complete orders
=> notification service listening to below 50 % event to sent email

Technology Stack

- **NestJS**
- **TypeORM**
- **Postgres**
- **Kafka**
- **Docker Compose**
- **TypeScript**
- **Nodemailer**

## Build and Start Services

Use Docker Compose to build and start all services and required env as .env.example:

i used pnpm in this project as package manager , to install it > npm i -g pnpm

#### Code

pnpm i && docker-compose up --build // to build and start the apps

pnpm i && pnpm run test // to run testcases

## Services

### `OrderProcessingService`

**Description**: Handles the processing of orders. It updates ingredient stock based on order items and manages transactions to ensure data consistency.

**Key Methods**:

- **`updateStock(orderId: number): Promise<void>`**: Processes the order with the given ID, deducts quantities from ingredient stocks, and emits notifications for low stock.

**Dependencies**:

- **Kafka Client**: For emitting notifications about ingredient stock levels.
- **TypeORM Repositories**:
  - `Order` - Manages orders.
  - `Ingredient` - Manages ingredients.
  - `OrderItem` - Manages items within orders.

**Entities Used**:

- **Order**
- **Ingredient**
- **OrderItem**

### `OrderCreationService`

**Description**: Manages the creation of new orders. It calculates total prices, processes order items, and emits events when orders are created.

**Key Methods**:

- **`create(createOrderDto: CreateOrderDto)`**: Creates a new order from the provided DTO, calculates the total price, and emits an order-created event.

**Dependencies**:

- **Kafka Client**: For emitting events about new orders.
- **TypeORM Repositories**:
  - `Order` - Manages orders.
  - `OrderItem` - Manages items within orders.
  - `Product` - Manages products.
  - `Ingredient` - Manages ingredients.
  - `ProductIngredient` - Manages the relationship between products and ingredients.

**Entities Used**:

- **Order**
- **OrderItem**
- **Product**
- **Ingredient**
- **ProductIngredient**

### `NotificationsService`

**Description**: Handles email notifications. It uses Nodemailer with OAuth2 authentication to send emails for various events such as low stock alerts.

**Key Methods**:

- **`sendEmail(to: string, subject: string, text: string, html?: string)`**: Sends an email to the specified recipient with the provided subject, text, and optional HTML content.

**Dependencies**:

- **Nodemailer**: For sending emails we could use sendgrid or mailchip
- **ConfigService**: For retrieving configuration values.

**Configuration**:

- **SMTP_USER**: Email address used for sending emails.
- **GOOGLE_OAUTH_CLIENT_ID**: OAuth2 client ID.
- **GOOGLE_OAUTH_CLIENT_SECRET**: OAuth2 client secret.
- **GOOGLE_OAUTH_REFRESH_TOKEN**: OAuth2 refresh token.
- **MERCHANT_EMAIL**: Default email address for sending emails.

**Room to improvments**: I built this project to be open to any change and to be a foundation for a fault Tolerance scalable system.

- using partition and more than broker for kafka
- add merchant entity
- add payments cycle
- parition postgres based on marchant Id

# API Endpoints

## Orders

| **HTTP Method** | **Endpoint**  | **Description**              | **Request Parameters**  | **Response**             |
| --------------- | ------------- | ---------------------------- | ----------------------- | ------------------------ |
| `POST`          | `/order`      | Create a new order           | `CreateOrderDto` (body) | `Order` object (created) |
| `POST`          | `/order/seed` | to seed products for testing |                         |                          |

# Kafka Events

## Order Created Event

| **Event Name**  | **Description**                     | **Payload**        |
| --------------- | ----------------------------------- | ------------------ |
| `ORDER_CREATED` | Emitted when a new order is created | `{ "id": number }` |

## Ingredient Low Stock Alert

| **Event Name** | **Description**                                                                             | **Payload**                       |
| -------------- | ------------------------------------------------------------------------------------------- | --------------------------------- |
| `NOTIFY`       | Emitted when an ingredient's stock falls below a threshold with ingredientId and user email | `{ "id": number, email: string }` |
