import { describe, expect, it } from "vitest";
import {
  MAX_CAMPAIGN_RECIPIENTS,
  SMS_MONTHLY_ALLOWANCE,
  allowedCountryCodes,
  blockedNumbers,
  checkCampaign,
  cleanRecipients,
  isE164,
  monthStartIso,
  monthlyAllowance,
  renderMessage,
  smsSegments,
} from "../sms";
import { SMS_MONTHLY_ALLOWANCE as APP_ALLOWANCE } from "../../../../src/lib/billing-plans";
import { MAX_RECIPIENTS, MAX_SMS_SEGMENTS as APP_MAX_SEGMENTS, renderMessage as appRenderMessage, smsSize } from "../../../../src/lib/recipients";
import { MAX_SMS_SEGMENTS } from "../sms";

const LINK = "https://happyclient.io/collect/acme";
const TEMPLATE = "Hi {first_name}, share a few words: {form_link} Reply STOP to opt out.";
const people = (count: number, prefix = "+1904555") =>
  Array.from({ length: count }, (_, i) => ({ phone: `${prefix}${String(i).padStart(4, "0")}`, first_name: "Sam" }));

describe("the app and the server agree", () => {
  it("on the monthly allowance for every plan", () => {
    expect(APP_ALLOWANCE).toEqual(SMS_MONTHLY_ALLOWANCE);
  });

  it("on the caps for one campaign", () => {
    expect(MAX_RECIPIENTS).toBe(MAX_CAMPAIGN_RECIPIENTS);
    expect(APP_MAX_SEGMENTS).toBe(MAX_SMS_SEGMENTS);
  });

  it("on how a message is filled in and counted", () => {
    const samples = [
      "",
      "Short and plain.",
      "x".repeat(160),
      "x".repeat(161),
      "x".repeat(307),
      "Price is 20€ {ok}",
      "Thanks 🙏 for everything",
      `${"y".repeat(70)}é`,
      `${"z".repeat(71)}“quoted”`,
    ];
    for (const sample of samples) {
      expect(smsSize(sample).segments).toBe(smsSegments(sample));
    }
    expect(appRenderMessage(TEMPLATE, " ", LINK)).toBe(renderMessage(TEMPLATE, " ", LINK));
    expect(appRenderMessage(TEMPLATE, "Dana", LINK)).toBe(renderMessage(TEMPLATE, "Dana", LINK));
  });
});

describe("monthlyAllowance", () => {
  it("gives nothing to the free plan and to unknown plans", () => {
    expect(monthlyAllowance("free")).toBe(0);
    expect(monthlyAllowance(null)).toBe(0);
    expect(monthlyAllowance("enterprise")).toBe(0);
  });

  it("reads paid plans in any letter case", () => {
    expect(monthlyAllowance("Starter")).toBe(100);
    expect(monthlyAllowance("pro")).toBe(500);
    expect(monthlyAllowance("scale")).toBeNull();
  });
});

describe("cleanRecipients", () => {
  it("keeps valid numbers once and trims names to a first name", () => {
    expect(
      cleanRecipients([
        { phone: "+19045550142", first_name: " Jane Doe " },
        { phone: "+19045550142", first_name: "Again" },
        { phone: "9045550142", first_name: "No plus" },
        { phone: "+1904", first_name: "Too short" },
        "junk",
        { phone: "+447700900123" },
      ]),
    ).toEqual([
      { phone: "+19045550142", first_name: "Jane" },
      { phone: "+447700900123", first_name: "" },
    ]);
  });

  it("returns an empty list for anything that is not a list", () => {
    expect(cleanRecipients(null)).toEqual([]);
    expect(cleanRecipients({ phone: "+19045550142" })).toEqual([]);
  });
});

describe("isE164", () => {
  it("needs a plus sign and 8 to 15 digits", () => {
    expect(isE164("+19045550142")).toBe(true);
    expect(isE164("+0123456789")).toBe(false);
    expect(isE164("19045550142")).toBe(false);
    expect(isE164(19045550142)).toBe(false);
  });
});

describe("country rules", () => {
  it("allows the US and Canada when nothing is set", () => {
    expect(allowedCountryCodes(undefined)).toEqual(["1"]);
    expect(allowedCountryCodes("  ")).toEqual(["1"]);
  });

  it("reads a list of codes from the setting", () => {
    expect(allowedCountryCodes("1, +44,61, nonsense")).toEqual(["1", "44", "61"]);
  });

  it("lists the numbers outside the allowed countries", () => {
    const list = [
      { phone: "+19045550142", first_name: "" },
      { phone: "+447700900123", first_name: "" },
    ];
    expect(blockedNumbers(list, ["1"])).toEqual(["+447700900123"]);
    expect(blockedNumbers(list, ["1", "44"])).toEqual([]);
  });
});

describe("smsSegments", () => {
  it("fits 160 plain characters in one text", () => {
    expect(smsSegments("a".repeat(160))).toBe(1);
    expect(smsSegments("a".repeat(161))).toBe(2);
    expect(smsSegments("a".repeat(306))).toBe(2);
    expect(smsSegments("a".repeat(307))).toBe(3);
  });

  it("fits only 70 characters when the message has an emoji", () => {
    expect(smsSegments(`${"a".repeat(68)}🙂`)).toBe(1);
    expect(smsSegments(`${"a".repeat(70)}🙂`)).toBe(2);
  });

  it("counts an empty message as no texts", () => {
    expect(smsSegments("")).toBe(0);
  });
});

describe("monthStartIso", () => {
  it("returns the first instant of the month in UTC", () => {
    expect(monthStartIso(new Date("2026-11-10T15:30:00Z"))).toBe("2026-11-01T00:00:00.000Z");
  });
});

describe("checkCampaign", () => {
  const base = { template: TEMPLATE, formLink: LINK, plan: "starter", usedThisMonth: 0, countryCodes: ["1"] };

  it("passes a normal campaign", () => {
    expect(checkCampaign({ ...base, recipients: people(25) })).toBeNull();
  });

  it("refuses the free plan before anything else", () => {
    expect(checkCampaign({ ...base, plan: "free", recipients: [] })).toEqual({ error: "sms_not_in_plan" });
  });

  it("refuses an empty or oversized list", () => {
    expect(checkCampaign({ ...base, recipients: [] })).toEqual({ error: "no_recipients" });
    expect(checkCampaign({ ...base, plan: "scale", recipients: people(MAX_CAMPAIGN_RECIPIENTS + 1) })).toEqual({
      error: "too_many_recipients",
      limit: MAX_CAMPAIGN_RECIPIENTS,
    });
  });

  it("refuses numbers in countries that are not turned on", () => {
    const recipients = [...people(2), { phone: "+447700900123", first_name: "Priya" }];
    expect(checkCampaign({ ...base, recipients })).toEqual({ error: "country_not_allowed", numbers: ["+447700900123"] });
  });

  it("refuses a message with no form link", () => {
    expect(checkCampaign({ ...base, template: "Hi {first_name}, how are you?", recipients: people(1) })).toEqual({
      error: "missing_form_link",
    });
  });

  it("refuses a message that is too long for the longest name", () => {
    const template = `${"x".repeat(440)} {first_name} {form_link}`;
    const result = checkCampaign({ ...base, template, recipients: people(1) });
    expect(result).toMatchObject({ error: "message_too_long" });
  });

  it("refuses a list that goes past the monthly allowance", () => {
    expect(checkCampaign({ ...base, usedThisMonth: 90, recipients: people(11) })).toEqual({
      error: "sms_allowance_exceeded",
      remaining: 10,
    });
    expect(checkCampaign({ ...base, usedThisMonth: 90, recipients: people(10) })).toBeNull();
  });

  it("has no monthly cap on the top plan", () => {
    expect(checkCampaign({ ...base, plan: "scale", usedThisMonth: 50_000, recipients: people(500) })).toBeNull();
  });
});
