import {
  defaultInputsFor,
  TRADES,
  type Inputs,
  type ModeId,
  type TradeId,
} from "./calc";

export function encodeSnapshot(inputs: Inputs): string {
  try {
    const json = JSON.stringify(inputs);
    if (typeof Buffer !== "undefined") {
      return Buffer.from(json, "utf-8").toString("base64");
    }
    const bytes = new TextEncoder().encode(json);
    let bin = "";
    for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
    return btoa(bin);
  } catch {
    return "";
  }
}

export function decodeSnapshot(raw: string): Inputs | null {
  try {
    let json: string;
    if (typeof Buffer !== "undefined") {
      json = Buffer.from(raw, "base64").toString("utf-8");
    } else {
      const bin = atob(raw);
      const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
      json = new TextDecoder().decode(bytes);
    }
    const obj = JSON.parse(json) as Partial<Inputs>;
    if (!obj || typeof obj !== "object") return null;
    if (!obj.trade || !(obj.trade in TRADES)) return null;
    if (
      obj.mode !== "conservative" &&
      obj.mode !== "research" &&
      obj.mode !== "aggressive"
    ) {
      return null;
    }
    return {
      ...defaultInputsFor(obj.trade as TradeId, obj.mode as ModeId),
      ...obj,
    } as Inputs;
  } catch {
    return null;
  }
}
