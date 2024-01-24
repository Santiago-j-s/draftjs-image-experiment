"use client";
import Editor from "@draft-js-plugins/editor";
import "draft-js/dist/Draft.css";
import { useEffect, useState } from "react";

import createImagePlugin from "@draft-js-plugins/image";
import { convertFromHTML, convertToHTML } from "draft-convert";
import { EditorState } from "draft-js";
import { text } from "./text";

const imagePlugin = createImagePlugin();

export const linkifyTextRaw = (
  htmlString: string,
  styles: { color?: string; textDecoration?: string } = {}
) => {
  try {
    const defaultStyles = {
      color: "var(--chakra-colors-blue-500) !important",
      textDecoration: "underline",
    };
    const modifiedHtmlString = htmlString.replace(
      /<a([^>]*)>/g,
      `<a$1 style="color: ${
        styles.color || defaultStyles.color
      }; text-decoration: ${
        styles.textDecoration || defaultStyles.textDecoration
      } !important;">`
    );
    return modifiedHtmlString;
  } catch (error) {
    return htmlString;
  }
};

export const htmlToDraftJS = (htmlString: string | null): EditorState => {
  if (!htmlString || htmlString === "") return EditorState.createEmpty();
  // Avoid errors if passing a none string
  if (typeof htmlString !== "string") return htmlString;
  const linkifyedHTML = linkifyTextRaw(htmlString);

  const blocksFromHTML = convertFromHTML({
    htmlToBlock: (nodeName, node) => {
      if (nodeName === "img") {
        return {
          type: "atomic",
          data: {
            src: node.src,
            srcSet: node.srcSet,
            type: "IMAGE",
            title: node.title,
            alt: node.alt,
          },
        };
      }
    },
    htmlToEntity: (nodeName, node, createEntity) => {
      if (nodeName === "a") {
        return createEntity("LINK", "MUTABLE", { url: node.href });
      }
      if (nodeName === "img") {
        return createEntity("IMAGE", "IMMUTABLE", {
          src: node.src,
          srcSet: node.srcSet,
          type: "IMAGE",
          title: node.title,
          alt: node.alt,
        });
      }
    },
  })(linkifyedHTML);

  return EditorState.createWithContent(blocksFromHTML);
};

export const draftJSToHtml = (value: EditorState) => {
  try {
    return convertToHTML({
      entityToHTML: (entity, originalText) => {
        if (entity.type === "LINK") {
          return (
            <a href={entity.data.url} rel="noreferrer" target="_blank">
              {originalText}
            </a>
          );
        }

        return originalText;
      },
    })(value?.getCurrentContent?.() || "");
  } catch (error) {
    console.error("Error converting draftjs to html", error);
  }
};

function MyEditor() {
  const [editorState, setEditorState] = useState(() => htmlToDraftJS(text));

  const [firstRender, setFirstRender] = useState(true);

  useEffect(() => {
    if (firstRender) {
      setFirstRender(false);
      return;
    }
  }, [firstRender]);

  if (firstRender) {
    return null;
  }

  return (
    <Editor
      editorState={editorState}
      onChange={setEditorState}
      plugins={[imagePlugin]}
    />
  );
}

export default function Home() {
  return (
    <main className="flex min-h-screen max-w-screen-lg overflow-hidden flex-col items-center justify-between p-24">
      <MyEditor />
      <pre className="p-4 whitespace-pre-wrap">{text}</pre>
    </main>
  );
}
