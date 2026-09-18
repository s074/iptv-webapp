import { describe, expect, it } from "vitest"
import {
  XmltvProgrammeStream,
  decodeXmlEntities,
  epgItemFromParts,
  parseXmltvTime,
} from "./xmltvStream"

const DOC = [
  '<?xml version="1.0" encoding="UTF-8"?>',
  "<tv>",
  '<channel id="a.us"><display-name>A</display-name></channel>',
  '<programme start="20260917013000 +0000" stop="20260917020000 +0000" channel="a.us">',
  '<title lang="en">Wheel &amp; Fortune</title>',
  "<desc><![CDATA[A show about <b>puzzles</b> & prizes]]></desc>",
  "</programme>",
  '<programme start="20260917020000 +0000" stop="20260917040000 +0000" channel="a.us">',
  "<title>Plain</title>",
  "</programme>",
  "</tv>",
  "",
].join("\n")

function feedAll(doc: string, slice: number) {
  const parser = new XmltvProgrammeStream()
  const out = []
  for (let i = 0; i < doc.length; i += slice) {
    out.push(...parser.push(doc.slice(i, i + slice)))
  }
  out.push(...parser.finish())
  return out
}

describe("XmltvProgrammeStream", () => {
  it("emits identical programmes at any chunk width", () => {
    const whole = feedAll(DOC, DOC.length)
    expect(whole).toHaveLength(2)
    for (const slice of [1, 2, 3, 5, 7, 13, 64, 4096]) {
      expect(feedAll(DOC, slice)).toEqual(whole)
    }
    expect(whole[0]).toMatchObject({
      channel: "a.us",
      start: "20260917013000 +0000",
      title: "Wheel & Fortune",
      desc: "A show about <b>puzzles</b> & prizes",
    })
  })

  it("ignores non-programme elements", () => {
    const programmes = feedAll(DOC, 4096)
    expect(programmes.every((p) => p.channel === "a.us")).toBe(true)
  })
})

describe("parseXmltvTime", () => {
  it("handles zones and zone-less walls as UTC", () => {
    expect(parseXmltvTime("20260917013000 +0000")).toBe(1789608600)
    expect(parseXmltvTime("20260917013000 +0200")).toBe(1789608600 - 7200)
    expect(parseXmltvTime("20260917013000")).toBe(1789608600)
    expect(parseXmltvTime("garbage")).toBeUndefined()
    expect(parseXmltvTime(undefined)).toBeUndefined()
  })
})

describe("decodeXmlEntities", () => {
  it("decodes named and numeric refs, keeps unknowns", () => {
    expect(decodeXmlEntities("a &amp; b &#65; &#x42; &bogus;")).toBe(
      "a & b A B &bogus;",
    )
  })
})

describe("epgItemFromParts", () => {
  it("builds stable flagged items", () => {
    const item = epgItemFromParts("a.us", "T", undefined, 100, 200)
    expect(item).toMatchObject({
      id: "a.us-100",
      title: "T",
      titleEncoded: false,
      start_timestamp: 100,
      stop_timestamp: 200,
      channel_id: "a.us",
    })
    expect(epgItemFromParts("a.us", undefined, undefined, 1, 2).title).toBe(
      "Unknown Program",
    )
  })
})
