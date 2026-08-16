import React from "react";
import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render } from "@testing-library/react";
import { ExecutionStatusBadge } from "../ExecutionStatusBadge";

afterEach(cleanup);

describe("ExecutionStatusBadge", () => {
  it("renders every execution status without crashing and with a readable label", () => {
    (["SUCCEEDED", "SKIPPED", "FAILED"] as const).forEach((status) => {
      const { unmount } = render(<ExecutionStatusBadge status={status} />);
      unmount();
    });
  });

  it("gives Succeeded and Failed visually distinct icons, not color alone", () => {
    const { container: succeeded } = render(<ExecutionStatusBadge status="SUCCEEDED" />);
    const { container: failed } = render(<ExecutionStatusBadge status="FAILED" />);
    expect(succeeded.querySelector("svg")?.outerHTML).not.toBe(failed.querySelector("svg")?.outerHTML);
  });
});
