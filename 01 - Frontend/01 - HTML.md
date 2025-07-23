## 1. semantic HTML

- Semantic HTML introduces meaning to the web content by using tags that clearly describe their purpose to both the browser and the developer. Examples include `<article>`, `<aside>`, `<nav>`, `<header>`, `<footer>`, `<section>`, and `<main>`. Using semantic elements improves accessibility, SEO, and code readability.

## **2. Difference between `<div>` and `<span>`?**

- **Answer:** `<div>` is a block-level element, meaning it starts on a new line and takes up the full width available. `<span>` is an inline element, meaning it flows with the surrounding text and only takes up as much width as necessary. `<div>` is typically used for sectioning content, while `<span>` is used for styling small parts of content within a block.

## 3. Responsive Design

- **Fluid Grids:** Using flexible, percentage-based layouts instead of fixed pixel widths so that the design adjusts to the screen size.
- **Flexible Images:** Images that can scale within their containing elements to prevent overflow and maintain aspect ratio on various devices. This is often achieved by setting `max-width: 100%` and `height: auto`. Techniques like using the `srcset` attribute or the `<picture>` element are also used to provide different image sizes or art direction.
- **Media Queries:** CSS rules that allow you to apply different styles based on device characteristics like screen width, height, orientation, and resolution. These are used to create breakpoints where the design layout adjusts.
- **Relative Units:** Using units like percentages (%), ems, and rems instead of fixed pixels (px) allows elements to scale proportionally with screen size. `em` units are relative to the parent element's font size, while `rem` units are relative to the root element's font size.
- **Mobile-First Design:** Prioritizing the design and development for smaller screens first, then progressively enhancing for larger screens using media queries. This ensures a good base experience on all devices.
- **Content Prioritization:** Identifying and making the most important content visible on all devices, potentially hiding or rearranging less critical content on smaller screens.

## 4. Accessibility:

---

**Using Screen Reader extention for accessibility test for web.**

"HTML accessibility is about making web content and applications usable and understandable for **everyone**, including people with disabilities who may rely on assistive technologies like screen readers or keyboard navigation.

We achieve this by building with **semantic HTML** first – using tags like `<button>`, `<nav>`, `<main>` because they inherently carry meaning for assistive technologies.

However, when semantic HTML isn't enough, we use **ARIA (Accessible Rich Internet Applications)** attributes to provide extra context:

- **`aria-label`**: This attribute provides a visible text label or a text alternative for elements that might not have one visually. For example, a button with only an icon would benefit from an `aria-label="Search"` to tell screen readers its purpose.
- **`role`**: This attribute explicitly defines the purpose or type of an element when semantic HTML isn't conveying enough information. For instance, if you're building a custom tab interface with `<div>`s, you'd use `role="tablist"` on the container and `role="tab"` on each individual tab to inform assistive technologies about their functionality.

Beyond ARIA, we also ensure good **color contrast** for readability and verify all interactive elements are fully **keyboard accessible**. Ultimately, prioritizing accessibility isn't just about compliance; it leads to a more robust, user-friendly, and inclusive experience for *all* users."