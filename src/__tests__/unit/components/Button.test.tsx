import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Button } from "@/components/ui/Button";

describe("Button component", () => {
  it("should render button with text", () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText("Click me")).toBeInTheDocument();
  });

  it("should render with primary variant by default", () => {
    const { container } = render(<Button>Primary</Button>);
    const button = container.querySelector("button");
    expect(button).toHaveClass("bg-purple-600");
  });

  it("should render with secondary variant", () => {
    const { container } = render(<Button variant="secondary">Secondary</Button>);
    const button = container.querySelector("button");
    expect(button).toHaveClass("bg-gray-700");
  });

  it("should render with ghost variant", () => {
    const { container } = render(<Button variant="ghost">Ghost</Button>);
    const button = container.querySelector("button");
    expect(button).toHaveClass("bg-transparent");
  });

  it("should render with danger variant", () => {
    const { container } = render(<Button variant="danger">Delete</Button>);
    const button = container.querySelector("button");
    expect(button).toHaveClass("bg-red-600");
  });

  it("should render small size", () => {
    const { container } = render(<Button size="sm">Small</Button>);
    const button = container.querySelector("button");
    expect(button).toHaveClass("px-3");
  });

  it("should render medium size", () => {
    const { container } = render(<Button size="md">Medium</Button>);
    const button = container.querySelector("button");
    expect(button).toHaveClass("px-4");
  });

  it("should render large size", () => {
    const { container } = render(<Button size="lg">Large</Button>);
    const button = container.querySelector("button");
    expect(button).toHaveClass("px-6");
  });

  it("should be disabled when disabled prop is true", () => {
    render(<Button disabled>Disabled</Button>);
    const button = screen.getByRole("button");
    expect(button).toBeDisabled();
  });

  it("should show loading state", () => {
    render(<Button isLoading>Loading</Button>);
    expect(screen.getByText(/carregando/i)).toBeInTheDocument();
  });

  it("should call onClick handler", async () => {
    const user = userEvent.setup();
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Click</Button>);
    
    await user.click(screen.getByRole("button"));
    expect(handleClick).toHaveBeenCalledOnce();
  });

  it("should have focus ring for accessibility", () => {
    const { container } = render(<Button>Focus</Button>);
    const button = container.querySelector("button");
    expect(button).toHaveClass("focus:outline-none");
    expect(button).toHaveClass("focus:ring-2");
  });

  it("should accept custom className", () => {
    const { container } = render(
      <Button className="custom-class">Custom</Button>
    );
    const button = container.querySelector("button");
    expect(button).toHaveClass("custom-class");
  });
});
