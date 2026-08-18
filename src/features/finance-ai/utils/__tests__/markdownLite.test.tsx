import React from "react";
import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { MarkdownLite } from "../markdownLite";

afterEach(cleanup);

describe("MarkdownLite — a safe, dependency-free renderer for assistant prose", () => {
  it("renders bold and bullet lists", () => {
    render(<MarkdownLite text={"You spent **₹4,200** on dining:\n- Swiggy\n- Zomato"} />);
    expect(screen.getByText("₹4,200")).toBeInTheDocument();
    expect(screen.getByText("₹4,200").tagName).toBe("STRONG");
    expect(screen.getByRole("list")).toBeInTheDocument();
    expect(screen.getByText("Swiggy")).toBeInTheDocument();
  });

  it("turns an https link into a real anchor with a safe rel", () => {
    render(<MarkdownLite text="See [your statement](https://example.com/statement)." />);
    const link = screen.getByRole("link", { name: "your statement" });
    expect(link).toHaveAttribute("href", "https://example.com/statement");
    expect(link).toHaveAttribute("rel", expect.stringContaining("noopener"));
  });

  it("never turns a javascript: URL into a clickable link — it prints as literal text", () => {
    const { container } = render(
      <MarkdownLite text="[click me](javascript:alert(1))" />,
    );
    expect(container.querySelector("a")).toBeNull();
    expect(container.textContent).toContain("[click me](javascript:alert(1))");
  });

  it("renders nothing for empty content rather than an empty wrapper", () => {
    const { container } = render(<MarkdownLite text="" />);
    expect(container.firstChild).toBeNull();
  });

  it("never uses dangerouslySetInnerHTML — a literal <script> tag in the text renders as text, not markup", () => {
    render(<MarkdownLite text={"<script>window.__pwned = true</script>"} />);
    expect(screen.getByText("<script>window.__pwned = true</script>")).toBeInTheDocument();
    expect(document.querySelector("script[data-injected]")).toBeNull();
  });
});
