import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Input } from "@/components/ui/Input";
import { Mail } from "lucide-react";

describe("Input component", () => {
  it("should render input field", () => {
    render(<Input />);
    const input = screen.getByRole("textbox");
    expect(input).toBeInTheDocument();
  });

  it("should render with label", () => {
    render(<Input label="Email" />);
    expect(screen.getByText("Email")).toBeInTheDocument();
  });

  it("should render with placeholder", () => {
    render(<Input placeholder="Enter email" />);
    const input = screen.getByPlaceholderText("Enter email");
    expect(input).toBeInTheDocument();
  });

  it("should handle input change", async () => {
    const user = userEvent.setup();
    const { container } = render(<Input />);
    const input = container.querySelector("input");

    if (input) {
      await user.type(input, "test@example.com");
      expect(input).toHaveValue("test@example.com");
    }
  });

  it("should display error message", () => {
    render(<Input error="Email is required" />);
    expect(screen.getByText("Email is required")).toBeInTheDocument();
  });

  it("should display helper text", () => {
    render(<Input helperText="Use your corporate email" />);
    expect(screen.getByText("Use your corporate email")).toBeInTheDocument();
  });

  it("should not display helper text when error exists", () => {
    render(
      <Input
        error="Error message"
        helperText="Helper text"
      />
    );
    expect(screen.queryByText("Helper text")).not.toBeInTheDocument();
    expect(screen.getByText("Error message")).toBeInTheDocument();
  });

  it("should render with icon", () => {
    const { container } = render(<Input icon={Mail} />);
    const svg = container.querySelector("svg");
    expect(svg).toBeInTheDocument();
  });

  it("should position icon on left by default", () => {
    const { container } = render(<Input icon={Mail} iconPosition="left" />);
    const input = container.querySelector("input");
    expect(input).toHaveClass("pl-10");
  });

  it("should position icon on right when specified", () => {
    const { container } = render(<Input icon={Mail} iconPosition="right" />);
    const input = container.querySelector("input");
    expect(input).toHaveClass("pr-10");
  });

  it("should be disabled when disabled prop is true", () => {
    render(<Input disabled />);
    const input = screen.getByRole("textbox");
    expect(input).toBeDisabled();
  });

  it("should show error styling when error exists", () => {
    const { container } = render(<Input error="Error" />);
    const input = container.querySelector("input");
    expect(input).toHaveClass("border-red-500");
  });

  it("should have focus ring for accessibility", () => {
    const { container } = render(<Input />);
    const input = container.querySelector("input");
    expect(input).toHaveClass("focus:outline-none");
    expect(input).toHaveClass("focus:ring-2");
  });

  it("should accept different input types", () => {
    const { rerender } = render(<Input type="email" />);
    let inputs = document.querySelectorAll("input");
    let input = inputs[inputs.length - 1] as HTMLInputElement;
    expect(input.type).toBe("email");

    rerender(<Input type="password" />);
    inputs = document.querySelectorAll("input");
    input = inputs[inputs.length - 1] as HTMLInputElement;
    expect(input.type).toBe("password");
  });
});
