## 🧠 **What is Normalization?**

Normalization is the process of organizing data in a database to:

- Reduce **redundancy** (repeating data)
- Improve **data integrity**
- Make the database easier to maintain

Each **normal form (NF)** is a step toward a better-structured schema.

---

## 🔹 1NF – **First Normal Form**

**Rule**:

✅ All data is **atomic** (no lists or nested structures in a single column)

✅ Each field contains only one value

✅ Each record (row) is unique

### ❌ Bad Example (Not 1NF)

| user_id | name | hobbies |
| --- | --- | --- |
| 1 | Alice | Reading, Cooking |
| 2 | Bob | Hiking, Swimming |

### ✅ Good Example (1NF applied)

| user_id | name | hobby |
| --- | --- | --- |
| 1 | Alice | Reading |
| 1 | Alice | Cooking |
| 2 | Bob | Hiking |
| 2 | Bob | Swimming |

---

## 🔹 2NF – **Second Normal Form**

**Rule**:

✅ Must be in **1NF**

✅ **No partial dependency** on a part of the primary key

> This matters only for tables with composite keys
>

### ❌ Bad Example

Imagine this table with a composite key `(student_id, course_id)`:

| student_id | course_id | student_name |
| --- | --- | --- |
| 1 | CS101 | Alice |

Here, `student_name` depends only on `student_id`, not the full key.

### ✅ Good Example (split into two tables)

- `students(student_id, student_name)`
- `enrollments(student_id, course_id)`

---

## 🔹 3NF – **Third Normal Form**

**Rule**:

✅ Must be in **2NF**

✅ **No transitive dependency** (non-key depends only on the key)

### ❌ Bad Example

| employee_id | department_id | department_name |
| --- | --- | --- |
| 1 | D01 | HR |

Here, `department_name` depends on `department_id`, not on `employee_id`.

### ✅ Good Example (split it)

- `employees(employee_id, department_id)`
- `departments(department_id, department_name)`

---

## 🧠 Summary Table

| Normal Form | Prevents... | Fix |
| --- | --- | --- |
| 1NF | Repeating groups, non-atomic fields | Use separate rows or tables |
| 2NF | Partial dependency | Split table if composite keys |
| 3NF | Transitive dependency | Separate into related tables |

---

## 🧪 Tip

**“What’s the highest normal form you should design to?”**

➡️ Say:

> "Usually 3NF is good enough for transactional systems. It removes most redundancy and keeps queries performant. Beyond that, forms like BCNF or 4NF are used in more advanced situations."
>