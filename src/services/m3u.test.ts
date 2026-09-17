import { describe, expect, it } from "vitest"
import { hashStreamId, m3uToLiveChannels, parseM3U } from "./m3u"

const SAMPLE = `#EXTM3U
#EXTINF:-1 tvg-id="KETV.us" tvg-name="ABC 7" tvg-logo="http://x/logo.png" group-title="US | News",ABC 7 Omaha
http://server:8080/live/u/p/1.m3u8
#EXTINF:-1 group-title="US | News",No Attrs Channel
http://server:8080/live/u/p/2.m3u8
#EXTINF:-1 tvg-name="Comma, In Name" group-title="Sports",Commas, Everywhere
http://server:8080/live/u/p/3.m3u8
#EXTINF:-1,Duplicate of one
http://server:8080/live/u/p/1.m3u8
#EXTINF:-1,No URL follows this one
`

describe("parseM3U", () => {
  it("parses entries, groups, and quoted commas", () => {
    const entries = parseM3U(SAMPLE)
    // duplicate URL dropped, trailing EXTINF without URL dropped
    expect(entries).toHaveLength(3)
    expect(entries[0]).toMatchObject({
      name: "ABC 7 Omaha",
      tvgId: "KETV.us",
      logo: "http://x/logo.png",
      group: "US | News",
      url: "http://server:8080/live/u/p/1.m3u8",
    })
    expect(entries[2].name).toBe("Commas, Everywhere")
    expect(entries[2].tvgName).toBe("Comma, In Name")
  })

  it("rejects non-playlists and empty results", () => {
    expect(() => parseM3U("hello")).toThrow()
    expect(() => parseM3U("#EXTM3U\n#EXTINF:-1,Foo\n")).toThrow()
  })

  it("resolves relative URLs against a base", () => {
    const entries = parseM3U(
      "#EXTM3U\n#EXTINF:-1,Rel\n/stream/1.m3u8\n",
      "http://server:8080/list.m3u",
    )
    expect(entries[0].url).toBe("http://server:8080/stream/1.m3u8")
  })
})

describe("m3uToLiveChannels", () => {
  it("maps every entry to a channel with namespaced categories", () => {
    const { categories, streams } = m3uToLiveChannels(parseM3U(SAMPLE))
    expect(categories.map((c) => c.category_name)).toEqual([
      "US | News",
      "Sports",
    ])
    expect(streams).toHaveLength(3)
    for (const s of streams) {
      expect(s.stream_type).toBe("live")
      expect(typeof s.direct_source).toBe("string")
    }
    // stable ids across re-parses
    const again = m3uToLiveChannels(parseM3U(SAMPLE))
    expect(again.streams.map((s) => s.stream_id)).toEqual(
      streams.map((s) => s.stream_id),
    )
    expect(hashStreamId("http://a")).toBe(hashStreamId("http://a"))
  })
})
