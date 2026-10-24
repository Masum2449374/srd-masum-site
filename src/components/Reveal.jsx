import { motion, useReducedMotion } from "framer-motion";

export const spring = { type: "spring", stiffness: 260, damping: 30, mass: 0.9 };

export default function Reveal({ children, delay = 0, className = "", as = "div", ...rest }) {
  const reduce = useReducedMotion();
  const Tag = motion[as];
  return (
    <Tag
      className={className}
      initial={reduce ? { opacity: 0 } : { opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ ...spring, delay }}
      {...rest}
    >
      {children}
    </Tag>
  );
}
