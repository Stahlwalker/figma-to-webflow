import { NextResponse } from "next/server";

/**
 * Returns a minimal hand-crafted XscpData JSON for testing paste into Webflow.
 * One Section > one Div (red background) > one Heading with text child node.
 */
export async function GET() {
  const xscpData = {
    type: "@webflow/XscpData",
    payload: {
      nodes: [
        {
          _id: "aaaa-1111",
          type: "Section",
          tag: "section",
          classes: ["style-section"],
          children: ["aaaa-2222"],
          data: {
            tag: "section",
            devlink: { runtimeProps: {}, slot: "" },
            displayName: "",
            attr: { id: "" },
            xattr: [],
            search: { exclude: false },
            visibility: {
              conditions: [],
              keepInHtml: { tag: "False", val: {} },
            },
            grid: { type: "section" },
          },
        },
        {
          _id: "aaaa-2222",
          type: "Block",
          tag: "div",
          classes: ["style-redbox"],
          children: ["aaaa-3333"],
          data: {
            tag: "div",
            devlink: { runtimeProps: {}, slot: "" },
            displayName: "",
            attr: { id: "" },
            xattr: [],
            search: { exclude: false },
            visibility: {
              conditions: [],
              keepInHtml: { tag: "False", val: {} },
            },
          },
        },
        {
          _id: "aaaa-3333",
          type: "Heading",
          tag: "h1",
          classes: ["style-heading"],
          children: ["aaaa-text-1"],
          data: {
            tag: "h1",
            devlink: { runtimeProps: {}, slot: "" },
            displayName: "",
            attr: { id: "" },
            xattr: [],
            search: { exclude: false },
            visibility: {
              conditions: [],
              keepInHtml: { tag: "False", val: {} },
            },
          },
        },
        // Text content as separate child node
        {
          _id: "aaaa-text-1",
          type: "Block",
          children: [],
          text: true,
          v: "Hello Webflow",
        },
      ],
      styles: [
        {
          _id: "style-section",
          fake: false,
          type: "class",
          name: "Test Section",
          namespace: "",
          comb: "",
          styleLess:
            "padding-top: 40px; padding-bottom: 40px; padding-left: 20px; padding-right: 20px; background-color: rgb(30, 30, 60);",
          variants: {},
          children: [],
          createdBy: "figma-to-webflow",
          selector: null,
        },
        {
          _id: "style-redbox",
          fake: false,
          type: "class",
          name: "Red Box",
          namespace: "",
          comb: "",
          styleLess:
            "background-color: rgb(255, 0, 0); width: 200px; height: 200px; display: flex; justify-content: center; align-items: center; border-radius: 12px;",
          variants: {},
          children: [],
          createdBy: "figma-to-webflow",
          selector: null,
        },
        {
          _id: "style-heading",
          fake: false,
          type: "class",
          name: "Test Heading",
          namespace: "",
          comb: "",
          styleLess:
            "color: rgb(255, 255, 255); font-size: 24px; font-weight: 700;",
          variants: {},
          children: [],
          createdBy: "figma-to-webflow",
          selector: null,
        },
      ],
      assets: [],
      ix1: [],
      ix2: { interactions: [], events: [], actionLists: [] },
    },
    meta: {
      unlinkedSymbolCount: 0,
      droppedLinks: 0,
      dynBindRemovedCount: 0,
      dynListBindRemovedCount: 0,
      paginationRemovedCount: 0,
      universalBindingsRemovedCount: 0,
      codeComponentsRemovedCount: 0,
    },
  };

  return NextResponse.json({ xscpData: JSON.stringify(xscpData) });
}
