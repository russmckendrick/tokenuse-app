function textContent(node) {
  if (!node) return "";
  if (node.type === "text") return node.value ?? "";
  if (!Array.isArray(node.children)) return "";
  return node.children.map(textContent).join("");
}

function classList(node) {
  const value = node?.properties?.className;
  if (Array.isArray(value)) return value.map(String);
  if (typeof value === "string") return value.split(/\s+/);
  return [];
}

function isMermaidPre(node) {
  if (node?.type !== "element" || node.tagName !== "pre") return false;
  if (node.properties?.dataLanguage === "mermaid" || node.properties?.["data-language"] === "mermaid") return true;

  const code = node.children?.find((child) => child?.type === "element" && child.tagName === "code");
  return classList(code).includes("language-mermaid");
}

function visitChildren(node) {
  if (!Array.isArray(node.children)) return;

  node.children = node.children.map((child) => {
    if (isMermaidPre(child)) {
      return {
        type: "element",
        tagName: "div",
        properties: {
          className: ["docs-mermaid", "mermaid"],
        },
        children: [
          {
            type: "text",
            value: textContent(child).trim(),
          },
        ],
      };
    }

    visitChildren(child);
    return child;
  });
}

export function rehypeMermaidBlocks() {
  return (tree) => {
    visitChildren(tree);
  };
}
