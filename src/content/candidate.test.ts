import { describe, expect, it } from "vitest";
import { dexIdFrom } from "./candidate";

// A minimal stand-in for the page's DOM: an element knows its class, parent, children and
// attributes, and answers `closest` / `querySelector` for the simple selectors the game uses.
type Stub = {
  className: string;
  tag: string;
  attributes: Record<string, string>;
  parent: Stub | null;
  children: Stub[];
};

const matches = (el: Stub, selector: string): boolean => {
  const [, tag, cls] = /^([a-z]*)(?:\.([\w-]+))?/.exec(selector) ?? [];
  return (!tag || el.tag === tag) && (!cls || el.className.split(" ").includes(cls));
};

function element(
  tag: string,
  className = "",
  attributes: Record<string, string> = {},
  children: Stub[] = [],
): Stub {
  const stub: Stub = { tag, className, attributes, parent: null, children };
  for (const child of children) child.parent = stub;
  return stub;
}

const descendants = (el: Stub): Stub[] => el.children.flatMap((c) => [c, ...descendants(c)]);

// The DOM methods dexIdFrom uses, over a stub.
function asElement(el: Stub): unknown {
  return {
    closest: (selector: string) => {
      for (let at: Stub | null = el; at; at = at.parent) {
        if (matches(at, selector)) return asElement(at);
      }
      return null;
    },
    querySelector: (selector: string) => {
      const found = descendants(el).find((d) => matches(d, selector));
      return found ? asElement(found) : null;
    },
    getAttribute: (name: string) => el.attributes[name] ?? null,
  };
}

// <button class="cand"><canvas class="thumb" data-id="25"></canvas><span class="num">#025</span></button>
function candidateButton(dexId: string) {
  const thumb = element("canvas", "thumb", { "data-id": dexId });
  const num = element("span", "num");
  const button = element("button", "cand", {}, [thumb, num]);
  return { button, thumb, num };
}

describe("dexIdFrom", () => {
  it("a candidate on the page yields the dex id on its thumbnail", () => {
    const { button } = candidateButton("25");
    expect(dexIdFrom(asElement(button))).toBe(25);
  });

  it("hovering a child of a candidate yields the candidate's dex id", () => {
    const { num, thumb } = candidateButton("150");
    expect(dexIdFrom(asElement(num))).toBe(150);
    expect(dexIdFrom(asElement(thumb))).toBe(150);
  });

  it("anything that isn't a candidate yields null", () => {
    const span = element("span", "label");
    element("div", "grid", {}, [span]);
    expect(dexIdFrom(asElement(span))).toBeNull();
    expect(dexIdFrom(null)).toBeNull();
    // The document itself, or a text node, has no `closest`.
    expect(dexIdFrom({})).toBeNull();
  });

  it("a candidate without a usable dex id yields null", () => {
    expect(dexIdFrom(asElement(candidateButton("").button))).toBeNull();
    expect(dexIdFrom(asElement(candidateButton("abc").button))).toBeNull();
    expect(dexIdFrom(asElement(element("button", "cand")))).toBeNull();
  });
});
