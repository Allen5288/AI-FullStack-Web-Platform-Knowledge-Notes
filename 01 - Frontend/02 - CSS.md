# **Responsive Strategies:**

- **Mobile-First Approach:** Design for the smallest screen first, then progressively enhance for larger screens. This forces prioritization of content and functionality.
- **Media Queries:** Use CSS `@media` rules to apply different styles based on screen width, height, device orientation, and resolution.
- **Flexible Grids (Flexbox & CSS Grid):** Use CSS Flexbox for one-dimensional layouts and CSS Grid for two-dimensional layouts to create highly flexible and adaptive component arrangements.
- **Relative Units:** Employ `em`, `rem`, `vw`, `vh` units instead of fixed `px` units for font sizes, spacing, and dimensions, allowing elements to scale proportionally.
- **Responsive Images:** Use `srcset` and `<picture>` elements for adaptive image loading, and CSS `max-width: 100%; height: auto;` for fluid images.
- **Viewport Meta Tag:** Essential for mobile browsers to correctly scale the page: `<meta name="viewport" content="width=device-width, initial-scale=1.0">`.
- **Component-Based Design:** Angular's component architecture naturally supports responsive design, as components can be designed to be self-contained and adapt internally.
- **User Testing on Real Devices:** Crucial for identifying unexpected issues that emulators might miss.

# **Explain the CSS Box Model.**

- **Answer:** The CSS Box Model describes how elements are rendered on a page.
    - **Content:** The actual content of the element (text, image, etc.).
    - **Padding:** The space between the content and the border.
    - **Border:** A line that surrounds the padding and content.
    - **Margin:** The space outside the border, separating the element from other elements.

# **What is CSS specificity? How is it calculated?**

- Inline styles (highest specificity)
- IDs
- Classes, attributes, and pseudo-classes
- Elements and pseudo-elements (lowest specificity)
A higher specificity value means the style is more likely to be applied.

# Felxbox vs Grid

- One direction(simple and linear layouts) vs two dimensional(complex)

# **What are CSS preprocessors (like Sass or Less)? What are their advantages?**

- **Answer:** CSS preprocessors are scripting languages that extend CSS with features like variables, nesting, mixins, functions, and partials. These are compiled into regular CSS.
- **Advantages:** Improved organization and maintainability, reduced repetition (DRY principle), more dynamic styling, and easier theme management.

# how to implement a dark mode in web applicaiton

- **Using CSS `prefers-color-scheme`:**Modern browsers have a media query called `prefers-color-scheme` that detects the user's system-wide preference for a light or dark theme. `@media (prefers-color-scheme: dark)` to apply overrides for dark mode.
- JS toggle is activated, you can add a class (e.g., `.dark-mode`) to a parent element (like the `<body>` or `<html>` tag).
- Using CSS Variables (Custom Properties): This is a highly recommended approach for managing themes. redefine these variables within your `@media (prefers-color-scheme: dark)` block or under your `.dark-mode` class.