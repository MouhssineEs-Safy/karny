# Karny — Simple Class Diagram

```mermaid
classDiagram
    class User {
        +int id
        +string name
        +string email
        +string password_hash
        +datetime created_at
    }

    class Customer {
        +int id
        +string name
        +string phone
        +decimal amount
        +int user_id
    }

    class Transaction {
        +int id
        +int customer_id
        +int user_id
        +string type
        +decimal amount
        +string note
        +datetime created_at
    }

    User "1" --> "0..*" Customer : owns
    User "1" --> "0..*" Transaction : records
    Customer "1" --> "0..*" Transaction : has