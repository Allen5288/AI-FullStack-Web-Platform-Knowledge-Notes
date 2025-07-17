Here’s a **complete and detailed schema** for a **Social Network** platform, including:

- User accounts
- Messaging system
- Friend connections
- Groups with single admin
- Group membership

All constraints and column types are included: primary keys, foreign keys, `UNIQUE`, data types (`VARCHAR`, `TEXT`, `INT`, `TIMESTAMP`, etc.).

---

## 📘 **Social Network - SQL Schema (PostgreSQL/MySQL Compatible)**

```sql
-- USERS TABLE
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    picture_url TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- FRIENDSHIPS (bidirectional, store each pair once: user_id < friend_id)
CREATE TABLE friends (
    user_id INT NOT NULL,
    friend_id INT NOT NULL,
    PRIMARY KEY (user_id, friend_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (friend_id) REFERENCES users(id) ON DELETE CASCADE,
    CHECK (user_id < friend_id) -- avoid duplicate reversed pairs
);

-- MESSAGES TABLE
CREATE TABLE messages (
    id SERIAL PRIMARY KEY,
    sender_id INT NOT NULL,
    receiver_id INT NOT NULL,
    content TEXT NOT NULL,
    sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (receiver_id) REFERENCES users(id) ON DELETE CASCADE
);

-- GROUPS TABLE
CREATE TABLE groups (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    admin_id INT NOT NULL,
    FOREIGN KEY (admin_id) REFERENCES users(id) ON DELETE SET NULL
);

-- GROUP MEMBERSHIP
CREATE TABLE group_members (
    group_id INT NOT NULL,
    user_id INT NOT NULL,
    PRIMARY KEY (group_id, user_id),
    FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

```

---

## 🔍 Key Design Notes

### 🔒 `users`

- `username` must be **unique**
- `password` stored **hashed**, not plain
- `picture_url` optional
- `created_at` auto set

### 🤝 `friends`

- Enforces no duplicate friendships
- One entry per pair (`user_id < friend_id`)

### 💬 `messages`

- Sender/receiver are both users
- Use `sent_at` for sorting/message history

### 👥 `groups`

- Each group has a **single admin** (user)
- When admin is deleted, can either:
  - `SET NULL`
  - or reassign

### 🧑‍🤝‍🧑 `group_members`

- Connects users to multiple groups
- Many-to-many relation

---

Sure! Here's a list of **common and useful SQL queries** for this **Social Network schema**, including a variety of SQL concepts:

---

## 🧠 Basic SELECT Queries

### 1. **Get all users**

```sql
SELECT id, username, picture_url FROM users;

```

---

## 🗨️ Messaging Queries

### 2. **Get all messages between Alice and Bob**

```sql
SELECT m.*
FROM messages m
JOIN users u1 ON m.sender_id = u1.id
JOIN users u2 ON m.receiver_id = u2.id
WHERE (u1.username = 'Alice' AND u2.username = 'Bob')
   OR (u1.username = 'Bob' AND u2.username = 'Alice')
ORDER BY sent_at;

```

### 3. **Get the latest message sent by each user**

```sql
SELECT sender_id, MAX(sent_at) AS last_sent
FROM messages
GROUP BY sender_id;
```

---

## 👫 Friendship Queries

### 4. **Get all friends of a user (by username)**

```sql
-- Friends where user is the first entry
SELECT u2.username AS friend
FROM friends f
JOIN users u1 ON f.user_id = u1.id
JOIN users u2 ON f.friend_id = u2.id
WHERE u1.username = 'Alice'

UNION

-- Friends where user is the second entry
SELECT u1.username AS friend
FROM friends f
JOIN users u1 ON f.user_id = u1.id
JOIN users u2 ON f.friend_id = u2.id
WHERE u2.username = 'Alice';

```

---

### 5. **Friends of friends (excluding direct friends)**

```sql
WITH direct_friends AS (
    SELECT friend_id FROM friends WHERE user_id = 1
    UNION
    SELECT user_id FROM friends WHERE friend_id = 1
),
friends_of_friends AS (
    SELECT friend_id FROM friends WHERE user_id IN (SELECT friend_id FROM direct_friends)
    UNION
    SELECT user_id FROM friends WHERE friend_id IN (SELECT friend_id FROM direct_friends)
)
SELECT DISTINCT u.username
FROM users u
WHERE u.id IN (SELECT * FROM friends_of_friends)
  AND u.id != 1
  AND u.id NOT IN (SELECT * FROM direct_friends);

```

---

## 👥 Groups Queries

### 6. **List all groups and their admin**

```sql
SELECT g.id, g.name, u.username AS admin_name
FROM groups g
JOIN users u ON g.admin_id = u.id;

```

### 7. **List all users in a given group**

```sql
SELECT u.username
FROM group_members gm
JOIN users u ON gm.user_id = u.id
JOIN groups g ON gm.group_id = g.id
WHERE g.name = 'Photography Club';

```

---

## 🔄 JOINS & Aggregates

### 8. **Count number of messages each user has sent**

```sql
SELECT u.username, COUNT(*) AS messages_sent
FROM messages m
JOIN users u ON m.sender_id = u.id
GROUP BY u.username;

```

---

### 9. **Count number of groups each user is in**

```sql
SELECT u.username, COUNT(*) AS group_count
FROM group_members gm
JOIN users u ON gm.user_id = u.id
GROUP BY u.username
ORDER BY group_count DESC;

```

---

## 🔒 Constraints Example (Check duplicate friendships manually)

### 10. **Detect invalid duplicate friend entries**

```sql
SELECT *
FROM friends
WHERE user_id > friend_id;

```

---
