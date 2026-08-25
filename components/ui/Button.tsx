import { type ButtonHTMLAttributes, type AnchorHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type ButtonVariant = "primary" | "text-link" | "primary-inverse";

type ButtonAsButton = ButtonHTMLAttributes<HTMLButtonElement> & {
  as?: "button";
  variant?: ButtonVariant;
};

type ButtonAsAnchor = AnchorHTMLAttributes<HTMLAnchorElement> & {
  as: "a";
  variant?: ButtonVariant;
};

type ButtonProps = ButtonAsButton | ButtonAsAnchor;

const baseStyles =
  "inline-flex items-center gap-2 font-sans transition-colors duration-200 focus-visible:outline-none";

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    "rounded-full bg-terra px-6 py-3 text-sm font-medium text-paper hover:bg-terra/90 active:bg-terra/80",
  "text-link":
    "text-sm font-medium text-terra underline-offset-4 hover:underline",
  "primary-inverse":
    "rounded-full bg-paper px-6 py-3 text-sm font-medium text-ink hover:bg-paper/90 active:bg-paper/80",
};

export default function Button({
  variant = "primary",
  className,
  ...props
}: ButtonProps) {
  const classes = cn(baseStyles, variantStyles[variant], className);

  if (props.as === "a") {
    const { as: _as, ...anchorProps } = props;
    void _as;
    return <a className={classes} {...anchorProps} />;
  }

  const { as: _as, ...buttonProps } = props as ButtonAsButton;
  void _as;
  return <button className={classes} {...buttonProps} />;
}