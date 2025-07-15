Let's design a schema for a **freelancing platform**, similar to **Freelancer.com**, where:

- **Publishers** post projects
- **Freelancers** can **bid** on those projects
- Users can be both publishers and freelancers
- Projects have deadlines, budgets, categories
- Each bid includes a proposed amount and message
- Optionally: Completed projects have a winner and review

We’ll walk through this **step-by-step** and **normalize to 3NF**.

---

## 🧱 Step-by-Step Schema Design: Freelancing Platform

### 🔹 `users` table

```sql
CREATE TABLE users (
  id INT PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  profile TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP

```

---

### 🔹 `projects` table

```sql
CREATE TABLE projects (
  id INT PRIMARY KEY,
  publisher_id INT NOT NULL,
  title VARCHAR(100) NOT NULL,
  description TEXT,
  category VARCHAR(50),
  budget DECIMAL(10,2),
  deadline DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (publisher_id) REFERENCES users(id)
);
```

> publisher_id is a foreign key to users.id — it tells us who posted the project.
>

---

### 🔹 `bids` table (with `is_awarded`)

```sql
CREATE TABLE bids (
  id INT PRIMARY KEY,
  project_id INT NOT NULL,
  freelancer_id INT NOT NULL,
  bid_amount DECIMAL(10,2),
  bid_message TEXT,
  is_awarded BOOLEAN DEFAULT FALSE,
  bid_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES projects(id),
  FOREIGN KEY (freelancer_id) REFERENCES users(id)
);
```

> is_awarded = TRUE means this bid won the project.
>

---

### 🔹 `reviews` table

```sql
CREATE TABLE reviews (
  id INT PRIMARY KEY,
  project_id INT,
  reviewer_id INT,
  reviewee_id INT,
  rating INT CHECK (rating BETWEEN 1 AND 5),
  comments TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES projects(id),
  FOREIGN KEY (reviewer_id) REFERENCES users(id),
  FOREIGN KEY (reviewee_id) REFERENCES users(id)
);
```

---

---

## 🔄 Entity Relationships Summary

| Table | Description |
| --- | --- |
| `users` | All platform users |
| `projects` | Projects posted by users |
| `bids` | Freelancers submit bids on projects |
| `reviews` | Optional feedback after completion |

---

This schema supports:

- Many freelancers bidding on a project
- Each project having 0 or 1 winner
- Each user being both publisher and freelancer
- Review system after completion

---

## 🔍 Sample Query

1. Get the winner of a project

```sql
SELECT b.freelancer_id, u.username, b.bid_amount
FROM bids b
JOIN users u ON b.freelancer_id = [u.id](http://u.id/)
WHERE b.project_id = 123 AND b.is_awarded = TRUE;
```

1. List all projects that **Bob has awarded** to someone

```sql
SELECT p.id AS project_id, p.title, u.username AS awarded_to, b.bid_amount
FROM projects p
JOIN users publisher ON p.publisher_id = publisher.id
JOIN bids b ON b.project_id = p.id AND b.is_awarded = TRUE
JOIN users u ON b.freelancer_id = u.id
WHERE publisher.username = 'Bob';

```

1. Show all projects that **Bob won**

```sql
SELECT [p.id](http://p.id/) AS project_id, p.title, p.budget, p.deadline, pub.username AS publisher
FROM bids b
JOIN users bob ON b.freelancer_id = [bob.id](http://bob.id/)
JOIN projects p ON b.project_id = [p.id](http://p.id/)
JOIN users pub ON p.publisher_id = [pub.id](http://pub.id/)
WHERE bob.username = 'Bob' AND b.is_awarded = TRUE;
```

List all bids **submitted by Alice**

```sql
SELECT p.title, b.bid_amount, b.is_awarded
FROM bids b
JOIN users u ON b.freelancer_id = u.id
JOIN projects p ON b.project_id = p.id
WHERE u.username = 'Alice';
```

---

1. Find the **number of bids** each project received

```sql
SELECT p.id AS project_id, p.title, COUNT(b.id) AS total_bids
FROM projects p
LEFT JOIN bids b ON b.project_id = p.id
GROUP BY p.id, p.title;
-- left join for returning all projects even there is no bids
-- COUNT(b.id) will ignore null, no bid will return 0
-- Group by to classify to ensure each project count for once
```

---

1. Show the **average bid amount** for each project

```sql
SELECT p.id AS project_id, p.title, AVG(b.bid_amount) AS avg_bid
FROM projects p
JOIN bids b ON b.project_id = p.id
GROUP BY p.id, p.title;
```

---

1. Find all freelancers who have **won at least 1 project**

```sql
SELECT u.id, u.username, COUNT(*) AS projects_won
FROM bids b
JOIN users u ON b.freelancer_id = u.id
WHERE b.is_awarded = TRUE
GROUP BY u.id, u.username;
-- COUNT(*) is equal to COUNT(b.id)
-- If use LEFT JOIN, then it will count user with 0, otherwise user with 0 will not show
```

---

8. Get the **latest 5 projects** posted

```sql
SELECT id, title, created_at
FROM projects
ORDER BY created_at DESC
LIMIT 5;
```

---

9. Show all projects that **have no bids**

```sql
SELECT p.id, p.title
FROM projects p
LEFT JOIN bids b ON b.project_id = p.id
WHERE b.id IS NULL;
```

---

10. For each project, show the **lowest bid** and the **freelancer** who made it

```sql
SELECT p.id AS project_id, p.title, b.bid_amount, u.username AS bidder
FROM bids b
JOIN (
  SELECT project_id, MIN(bid_amount) AS min_bid
  FROM bids
  GROUP BY project_id
) lowest ON b.project_id = lowest.project_id AND b.bid_amount = lowest.min_bid
JOIN projects p ON b.project_id = p.id
JOIN users u ON b.freelancer_id = u.id;
```
