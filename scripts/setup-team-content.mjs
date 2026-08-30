import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";

const ROOT = process.cwd();
const VERIFY_ONLY = process.argv.includes("--verify-only");
const TEAM = "team_members";
const TRANSLATIONS = "team_members_translations";
const LANGUAGES = ["en", "tr", "ar", "fa"];
const CATEGORIES = [
  "leadership",
  "research_advisory",
  "research",
  "engineering",
  "education",
  "operations"
];

async function readLocalEnvironment() {
  try {
    const source = await readFile(path.join(ROOT, ".env.local"), "utf8");
    for (const line of source.split(/\r?\n/u)) {
      const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/u);
      if (!match || process.env[match[1]] !== undefined) continue;
      let value = match[2];
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
      process.env[match[1]] = value;
    }
  } catch (error) {
    if (error?.code !== "ENOENT") throw error;
  }
}

await readLocalEnvironment();

const DIRECTUS_URL = (
  process.env.DIRECTUS_URL ??
  process.env.NEXT_PUBLIC_DIRECTUS_URL ??
  ""
).replace(/\/$/u, "");
const TOKEN = process.env.DIRECTUS_SCHEMA_TOKEN ?? "";

if (!DIRECTUS_URL || !TOKEN) {
  throw new Error("DIRECTUS_URL/NEXT_PUBLIC_DIRECTUS_URL and DIRECTUS_SCHEMA_TOKEN are required.");
}

const parsedDirectusUrl = new URL(DIRECTUS_URL);
if (
  !["localhost", "127.0.0.1", "::1"].includes(parsedDirectusUrl.hostname) &&
  process.env.ALLOW_REMOTE_DIRECTUS_TEAM_SETUP !== "true"
) {
  throw new Error(
    "Refusing to change a non-local Directus instance. Set ALLOW_REMOTE_DIRECTUS_TEAM_SETUP=true only after reviewing the target."
  );
}

function directusError(payload, status) {
  const detail = payload?.errors?.[0];
  const code = detail?.extensions?.code ? ` (${detail.extensions.code})` : "";
  return new Error(
    `Directus request failed with HTTP ${status}${code}: ${detail?.message ?? "Unknown error"}`
  );
}

async function request(endpoint, { method = "GET", body, anonymous = false, expected } = {}) {
  const headers = anonymous ? {} : { Authorization: `Bearer ${TOKEN}` };
  if (body !== undefined && !(body instanceof FormData))
    headers["Content-Type"] = "application/json";
  const response = await fetch(`${DIRECTUS_URL}${endpoint}`, {
    method,
    headers,
    body: body instanceof FormData ? body : body === undefined ? undefined : JSON.stringify(body)
  });
  const contentType = response.headers.get("content-type") ?? "";
  const payload = contentType.includes("application/json") ? await response.json() : null;
  if (expected?.includes(response.status)) return { response, payload };
  if (!response.ok) throw directusError(payload, response.status);
  return { response, payload };
}

async function list(endpoint, params = {}) {
  const query = new URLSearchParams();
  query.set("limit", "-1");
  for (const [key, value] of Object.entries(params)) {
    query.set(
      key,
      key === "fields" && Array.isArray(value) ? value.join(",") : JSON.stringify(value)
    );
  }
  return (await request(`${endpoint}?${query}`)).payload.data;
}

const choiceOptions = (choices) => ({ choices: choices.map((value) => ({ text: value, value })) });
const idField = {
  field: "id",
  type: "uuid",
  meta: { hidden: true, interface: "input", readonly: true, special: ["uuid"] },
  schema: { data_type: "uuid", is_primary_key: true, is_nullable: false }
};

const fields = {
  [TEAM]: [
    {
      field: "status",
      type: "string",
      meta: {
        interface: "select-dropdown",
        options: choiceOptions(["draft", "published"]),
        required: true,
        width: "half"
      },
      schema: { default_value: "draft", is_nullable: false, max_length: 32 }
    },
    {
      field: "sort",
      type: "integer",
      meta: { interface: "input", width: "half" },
      schema: { default_value: 0 }
    },
    {
      field: "slug",
      type: "string",
      meta: { interface: "input", required: true },
      schema: { is_nullable: false, is_unique: true, max_length: 120 }
    },
    {
      field: "full_name",
      type: "string",
      meta: { interface: "input", required: true },
      schema: { is_nullable: false, max_length: 160 }
    },
    {
      field: "photo",
      type: "uuid",
      meta: { interface: "file-image", special: ["file"] },
      schema: { is_nullable: true }
    },
    {
      field: "linkedin_url",
      type: "string",
      meta: { interface: "input" },
      schema: { is_nullable: true, max_length: 500 }
    },
    {
      field: "category",
      type: "string",
      meta: { interface: "select-dropdown", options: choiceOptions(CATEGORIES), required: true },
      schema: { is_nullable: false, max_length: 64 }
    },
    {
      field: "expertise",
      type: "json",
      meta: { interface: "tags", special: ["cast-json"], required: true },
      schema: { is_nullable: false, default_value: "[]" }
    },
    {
      field: "translations",
      type: "alias",
      meta: { interface: "list-o2m", special: ["o2m"] },
      schema: null
    }
  ],
  [TRANSLATIONS]: [
    {
      field: "team_member",
      type: "uuid",
      meta: { interface: "select-dropdown-m2o", special: ["m2o"], required: true },
      schema: { is_nullable: false }
    },
    {
      field: "language",
      type: "string",
      meta: { interface: "select-dropdown", options: choiceOptions(LANGUAGES), required: true },
      schema: { is_nullable: false, max_length: 8 }
    },
    {
      field: "job_title",
      type: "string",
      meta: { interface: "input", required: true },
      schema: { is_nullable: false, max_length: 160 }
    },
    {
      field: "bio",
      type: "text",
      meta: { interface: "input-multiline", required: true },
      schema: { is_nullable: false }
    },
    {
      field: "expertise",
      type: "json",
      meta: { interface: "tags", special: ["cast-json"], required: true },
      schema: { is_nullable: false, default_value: "[]" }
    },
    {
      field: "photo_alt",
      type: "string",
      meta: { interface: "input", required: true },
      schema: { is_nullable: false, max_length: 240 }
    }
  ]
};

const members = [
  {
    slug: "mahyar-teymournezhad",
    status: "published",
    sort: 1,
    full_name: "Mahyar Teymournezhad",
    linkedin_url: "https://www.linkedin.com/in/mahyarteymournezhad",
    category: "leadership",
    expertise: ["Leadership", "Artificial Intelligence", "R&D", "Strategy"],
    image: "mahyar-teymournezhad.jpg",
    translations: {
      en: [
        "Founder & CEO",
        "Mahyar Teymournezhad is the Founder and CEO of Synergy Maze AI, guiding the company's work across artificial intelligence, technology, research and development, and education.",
        ["Leadership", "Artificial Intelligence", "R&D", "Strategy"],
        "Portrait of Mahyar Teymournezhad"
      ],
      tr: [
        "Kurucu ve CEO",
        "Mahyar Teymournezhad, Synergy Maze AI'ın Kurucusu ve CEO'sudur; şirketin yapay zeka, teknoloji, araştırma-geliştirme ve eğitim alanlarındaki çalışmalarına yön verir.",
        ["Liderlik", "Yapay Zeka", "Ar-Ge", "Strateji"],
        "Mahyar Teymournezhad portresi"
      ],
      ar: [
        "المؤسس والرئيس التنفيذي",
        "مهیار تیمورنژاد هو مؤسس Synergy Maze AI ورئيسها التنفيذي، ويقود أعمال الشركة في الذكاء الاصطناعي والتكنولوجيا والبحث والتطوير والتعليم.",
        ["القيادة", "الذكاء الاصطناعي", "البحث والتطوير", "الاستراتيجية"],
        "صورة شخصية لمهیار تیمورنژاد"
      ],
      fa: [
        "بنیان‌گذار و مدیرعامل",
        "مهیار تیمورنژاد بنیان‌گذار و مدیرعامل Synergy Maze AI است و فعالیت‌های شرکت را در حوزه‌های هوش مصنوعی، فناوری، تحقیق‌وتوسعه و آموزش هدایت می‌کند.",
        ["رهبری", "هوش مصنوعی", "تحقیق و توسعه", "راهبرد"],
        "پرتره مهیار تیمورنژاد"
      ]
    }
  },
  {
    slug: "ozgur-koray-sahingoz",
    status: "published",
    sort: 2,
    full_name: "Prof. Dr. Özgür Koray Şahingöz",
    linkedin_url: "https://www.linkedin.com/in/sahingoz",
    category: "research_advisory",
    expertise: ["Research", "Artificial Intelligence", "Academia", "Mentorship"],
    image: "ozgur-koray-sahingoz.jpg",
    translations: {
      en: [
        "Academic Advisor",
        "Prof. Dr. Özgür Koray Şahingöz is MazeAI's Academic Advisor and a Professor of Computer Engineering at Biruni University. His academic work includes artificial intelligence, machine learning and computer engineering.",
        ["Research", "Artificial Intelligence", "Academia", "Mentorship"],
        "Portrait of Prof. Dr. Özgür Koray Şahingöz"
      ],
      tr: [
        "Akademik Danışman",
        "Prof. Dr. Özgür Koray Şahingöz, MazeAI'ın Akademik Danışmanı ve Biruni Üniversitesi Bilgisayar Mühendisliği profesörüdür. Akademik çalışmaları yapay zeka, makine öğrenmesi ve bilgisayar mühendisliğini kapsar.",
        ["Araştırma", "Yapay Zeka", "Akademi", "Mentorluk"],
        "Prof. Dr. Özgür Koray Şahingöz portresi"
      ],
      ar: [
        "المستشار الأكاديمي",
        "الأستاذ الدكتور أوزغور كوراي شاهينغوز هو المستشار الأكاديمي لـ MazeAI وأستاذ هندسة الحاسوب في جامعة بيروني. تشمل أعماله الأكاديمية الذكاء الاصطناعي وتعلّم الآلة وهندسة الحاسوب.",
        ["البحث", "الذكاء الاصطناعي", "العمل الأكاديمي", "الإرشاد"],
        "صورة شخصية للأستاذ الدكتور أوزغور كوراي شاهينغوز"
      ],
      fa: [
        "مشاور دانشگاهی",
        "پروفسور دکتر اوزگور کورای شاهین‌گوز مشاور دانشگاهی MazeAI و استاد مهندسی کامپیوتر در دانشگاه بیرونی است. فعالیت دانشگاهی او هوش مصنوعی، یادگیری ماشین و مهندسی کامپیوتر را دربر می‌گیرد.",
        ["پژوهش", "هوش مصنوعی", "دانشگاه", "راهنمایی علمی"],
        "پرتره پروفسور دکتر اوزگور کورای شاهین‌گوز"
      ]
    }
  }
];

function assertCompatibleField(actual, expected) {
  if (actual.type !== expected.type) {
    throw new Error(
      `Existing ${actual.collection}.${actual.field} is ${actual.type}, expected ${expected.type}.`
    );
  }
  if (expected.schema?.is_primary_key && !actual.schema?.is_primary_key) {
    throw new Error(`Existing ${actual.collection}.${actual.field} is not a primary key.`);
  }
  if (expected.schema?.is_unique && !actual.schema?.is_unique) {
    throw new Error(`Existing ${actual.collection}.${actual.field} is not unique.`);
  }
  for (const property of ["is_nullable", "max_length"]) {
    if (
      expected.schema?.[property] !== undefined &&
      actual.schema?.[property] !== expected.schema[property]
    ) {
      throw new Error(
        `Existing ${actual.collection}.${actual.field} has incompatible ${property}.`
      );
    }
  }
  const expectedSpecial = expected.meta?.special ?? [];
  const actualSpecial = actual.meta?.special ?? [];
  if (expectedSpecial.some((value) => !actualSpecial.includes(value))) {
    throw new Error(
      `Existing ${actual.collection}.${actual.field} has incompatible special metadata.`
    );
  }
}

async function ensureCollectionsAndFields(summary) {
  const collections = await list("/collections");
  for (const collection of [TEAM, TRANSLATIONS]) {
    const existing = collections.find((entry) => entry.collection === collection);
    if (!existing) {
      if (VERIFY_ONLY) throw new Error(`Required collection ${collection} does not exist.`);
      await request("/collections", {
        method: "POST",
        body: {
          collection,
          meta: {
            icon: collection === TEAM ? "groups" : "translate",
            hidden: collection === TRANSLATIONS,
            display_template: collection === TEAM ? "{{full_name}}" : "{{language}}"
          },
          schema: { name: collection },
          fields: [idField]
        }
      });
      summary.collections[collection] = "created";
    } else {
      summary.collections[collection] = "reused";
    }

    const existingFields = await list(`/fields/${collection}`);
    const id = existingFields.find((field) => field.field === "id");
    if (!id) throw new Error(`${collection} exists without an id field.`);
    assertCompatibleField(id, idField);
    for (const definition of fields[collection]) {
      const found = existingFields.find((field) => field.field === definition.field);
      if (found) {
        assertCompatibleField(found, definition);
        continue;
      }
      if (VERIFY_ONLY)
        throw new Error(`Required field ${collection}.${definition.field} does not exist.`);
      await request(`/fields/${collection}`, { method: "POST", body: definition });
    }
  }
}

async function ensureRelation(definition) {
  const relations = await list("/relations");
  const existing = relations.find(
    (relation) =>
      relation.collection === definition.collection && relation.field === definition.field
  );
  if (existing) {
    if (existing.related_collection !== definition.related_collection) {
      throw new Error(
        `Existing relation ${definition.collection}.${definition.field} targets the wrong collection.`
      );
    }
    if ((existing.meta?.one_field ?? null) !== (definition.meta?.one_field ?? null)) {
      throw new Error(
        `Existing relation ${definition.collection}.${definition.field} has an incompatible O2M alias.`
      );
    }
    if (
      definition.schema?.on_delete &&
      existing.schema?.on_delete !== definition.schema.on_delete
    ) {
      throw new Error(
        `Existing relation ${definition.collection}.${definition.field} has an incompatible delete rule.`
      );
    }
    return;
  }
  if (VERIFY_ONLY)
    throw new Error(
      `Required relation ${definition.collection}.${definition.field} does not exist.`
    );
  await request("/relations", { method: "POST", body: definition });
}

async function ensureRelations() {
  await ensureRelation({
    collection: TEAM,
    field: "photo",
    related_collection: "directus_files",
    meta: { one_field: null },
    schema: { on_delete: "SET NULL" }
  });
  await ensureRelation({
    collection: TRANSLATIONS,
    field: "team_member",
    related_collection: TEAM,
    meta: { one_field: "translations" },
    schema: { on_delete: "CASCADE" }
  });
}

async function ensureFile(filename) {
  const local = await readFile(path.join(ROOT, "public", "images", "team", filename));
  const found = await list("/files", {
    filter: { filename_download: { _eq: filename } },
    fields: ["id", "filename_download"]
  });
  if (found.length > 1)
    throw new Error(`Multiple Directus files use ${filename}; refusing to guess.`);
  if (found.length === 1) {
    const response = await fetch(`${DIRECTUS_URL}/assets/${found[0].id}`, {
      headers: { Authorization: `Bearer ${TOKEN}` }
    });
    if (!response.ok) throw new Error(`Could not read existing Directus file ${filename}.`);
    const downloaded = Buffer.from(await response.arrayBuffer());
    if (
      createHash("sha256").update(downloaded).digest("hex") !==
      createHash("sha256").update(local).digest("hex")
    ) {
      throw new Error(`Existing Directus file ${filename} has different content.`);
    }
    return found[0].id;
  }
  if (VERIFY_ONLY) throw new Error(`Required Directus file ${filename} does not exist.`);
  const form = new FormData();
  form.set("title", filename.replace(/\.jpg$/u, "").replaceAll("-", " "));
  form.set("file", new Blob([local], { type: "image/jpeg" }), filename);
  return (await request("/files", { method: "POST", body: form })).payload.data.id;
}

async function upsertItem(collection, filter, data) {
  const found = await list(`/items/${collection}`, { filter, fields: ["*"] });
  if (found.length > 1)
    throw new Error(`Multiple ${collection} records match ${JSON.stringify(filter)}.`);
  if (found.length === 1) {
    if (!VERIFY_ONLY)
      await request(`/items/${collection}/${found[0].id}`, { method: "PATCH", body: data });
    return found[0].id;
  }
  if (VERIFY_ONLY) throw new Error(`A required ${collection} record is missing.`);
  return (await request(`/items/${collection}`, { method: "POST", body: data })).payload.data.id;
}

async function ensureContent(summary) {
  for (const member of members) {
    const photo = await ensureFile(member.image);
    summary.files[member.image] = photo;
    const { image, translations, ...record } = member;
    const memberId = await upsertItem(TEAM, { slug: { _eq: member.slug } }, { ...record, photo });
    summary.members[member.slug] = { id: memberId, translations: {} };
    for (const language of LANGUAGES) {
      const [job_title, bio, expertise, photo_alt] = translations[language];
      const translationId = await upsertItem(
        TRANSLATIONS,
        { _and: [{ team_member: { _eq: memberId } }, { language: { _eq: language } }] },
        { team_member: memberId, language, job_title, bio, expertise, photo_alt }
      );
      summary.members[member.slug].translations[language] = translationId;
    }
  }
}

const readPermissions = {
  [TEAM]: {
    fields: [
      "id",
      "status",
      "sort",
      "slug",
      "full_name",
      "photo",
      "linkedin_url",
      "category",
      "expertise",
      "translations"
    ],
    permissions: { _and: [{ status: { _eq: "published" } }] }
  },
  [TRANSLATIONS]: {
    fields: ["id", "team_member", "language", "job_title", "bio", "expertise", "photo_alt"],
    permissions: { _and: [{ team_member: { status: { _eq: "published" } } }] }
  }
};

function canonicalJson(value) {
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.keys(value)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${canonicalJson(value[key])}`)
      .join(",")}}`;
  }
  return JSON.stringify(value);
}

function assertPermissionMatches(current, desired, collection) {
  const actualFields = Array.isArray(current.fields)
    ? current.fields
    : String(current.fields ?? "")
        .split(",")
        .filter(Boolean);
  if (
    actualFields.length !== desired.fields.length ||
    desired.fields.some((field) => !actualFields.includes(field))
  ) {
    throw new Error(
      `Public read field allowlist for ${collection} does not match the required policy.`
    );
  }
  if (canonicalJson(current.permissions) !== canonicalJson(desired.permissions)) {
    throw new Error(`Public read filter for ${collection} does not match the required policy.`);
  }
}

async function ensurePermissions(summary) {
  const policies = await list("/policies", {
    filter: { name: { _eq: "$t:public_label" } },
    fields: ["id", "name", "admin_access", "app_access"]
  });
  if (policies.length !== 1 || policies[0].admin_access || policies[0].app_access) {
    throw new Error("Could not identify exactly one least-privilege Directus Public policy.");
  }
  const policy = policies[0];
  const existing = await list("/permissions", {
    filter: { policy: { _eq: policy.id } },
    fields: ["*"]
  });
  const mutation = existing.find(
    (permission) =>
      [TEAM, TRANSLATIONS, "directus_files"].includes(permission.collection) &&
      ["create", "update", "delete"].includes(permission.action)
  );
  if (mutation)
    throw new Error(
      `Public mutation permission already exists for ${mutation.collection}.${mutation.action}.`
    );

  const desired = {
    ...readPermissions,
    directus_files: {
      fields: [
        "id",
        "storage",
        "filename_disk",
        "filename_download",
        "title",
        "type",
        "folder",
        "uploaded_by",
        "created_on",
        "modified_by",
        "modified_on",
        "charset",
        "filesize",
        "width",
        "height",
        "duration",
        "embed",
        "description",
        "location",
        "tags",
        "metadata",
        "focal_point_x",
        "focal_point_y",
        "tus_id",
        "tus_data",
        "uploaded_on"
      ],
      permissions: { _and: [{ id: { _in: Object.values(summary.files) } }] }
    }
  };

  for (const collection of [TEAM, TRANSLATIONS, "directus_files"]) {
    const current = existing.filter(
      (permission) => permission.collection === collection && permission.action === "read"
    );
    if (current.length > 1)
      throw new Error(`Multiple public read permissions exist for ${collection}.`);
    const body = {
      policy: policy.id,
      collection,
      action: "read",
      ...desired[collection],
      validation: null,
      presets: null
    };
    let id;
    if (current.length === 1) {
      id = current[0].id;
      if (VERIFY_ONLY) assertPermissionMatches(current[0], desired[collection], collection);
      else await request(`/permissions/${id}`, { method: "PATCH", body });
    } else {
      if (VERIFY_ONLY) throw new Error(`Public read permission for ${collection} is missing.`);
      id = (await request("/permissions", { method: "POST", body })).payload.data.id;
    }
    summary.permissions[collection] = id;
  }
}

async function anonymousJson(endpoint, options = {}) {
  return request(endpoint, { ...options, anonymous: true });
}

async function verifyAnonymous(summary) {
  const fieldsQuery = [
    "id",
    "status",
    "sort",
    "slug",
    "full_name",
    "photo",
    "linkedin_url",
    "category",
    "expertise",
    "translations.id",
    "translations.language",
    "translations.job_title",
    "translations.bio",
    "translations.expertise",
    "translations.photo_alt"
  ].join(",");
  const result = await anonymousJson(
    `/items/${TEAM}?fields=${encodeURIComponent(fieldsQuery)}&sort=sort,slug,id&limit=-1`
  );
  const records = result.payload.data;
  if (
    records.length !== 2 ||
    records.some((record) => record.status !== "published" || record.translations?.length !== 4)
  ) {
    throw new Error(
      "Anonymous Team read did not return exactly two published records with four translations each."
    );
  }
  if (
    records.some(
      (record) =>
        !LANGUAGES.every((language) =>
          record.translations.some((translation) => translation.language === language)
        )
    )
  ) {
    throw new Error("Anonymous Team read is missing one or more required locales.");
  }
  for (const id of Object.values(summary.files)) {
    const asset = await anonymousJson(`/assets/${id}?width=32`);
    if (!asset.response.headers.get("content-type")?.startsWith("image/")) {
      throw new Error(`Anonymous asset ${id} did not return an image.`);
    }
  }

  const create = await anonymousJson(`/items/${TEAM}`, {
    method: "POST",
    body: { slug: "must-not-create", full_name: "Denied", category: "leadership", expertise: [] },
    expected: [401, 403]
  });
  if (![401, 403].includes(create.response.status))
    throw new Error("Anonymous create was not forbidden.");

  if (!VERIFY_ONLY) {
    const slug = "team-permission-verification-draft";
    const sentinel = await upsertItem(
      TEAM,
      { slug: { _eq: slug } },
      {
        status: "draft",
        sort: 9999,
        slug,
        full_name: "Permission verification draft",
        category: "operations",
        expertise: []
      }
    );
    try {
      const hidden = await anonymousJson(
        `/items/${TEAM}?filter[slug][_eq]=${slug}&fields=id&limit=1`
      );
      if (hidden.payload.data.length !== 0)
        throw new Error("Draft Team record was visible anonymously.");
      for (const [method, body] of [
        ["PATCH", { sort: 9999 }],
        ["DELETE", undefined]
      ]) {
        const denied = await anonymousJson(`/items/${TEAM}/${sentinel}`, {
          method,
          body,
          expected: [401, 403]
        });
        if (![401, 403].includes(denied.response.status))
          throw new Error(`Anonymous ${method} was not forbidden.`);
      }
    } finally {
      const remaining = await list(`/items/${TEAM}`, {
        filter: { id: { _eq: sentinel } },
        fields: ["id"]
      });
      if (remaining.length) await request(`/items/${TEAM}/${sentinel}`, { method: "DELETE" });
    }
  }
  summary.anonymous = {
    publishedRecords: records.length,
    translationsPerRecord: 4,
    assetsReadable: true,
    draftsHidden: VERIFY_ONLY ? "verified-by-permission-filter" : true,
    mutationsForbidden: true
  };
}

async function main() {
  const summary = {
    mode: VERIFY_ONLY ? "verify-only" : "apply-and-verify",
    directus: { url: DIRECTUS_URL, version: null },
    collections: {},
    files: {},
    members: {},
    permissions: {},
    anonymous: {}
  };
  const serverInfo = (await request("/server/info")).payload.data;
  summary.directus.version = serverInfo?.directus?.version ?? serverInfo?.version ?? "not-exposed";
  await ensureCollectionsAndFields(summary);
  await ensureRelations();
  await ensureContent(summary);
  await ensurePermissions(summary);
  await verifyAnonymous(summary);
  console.log(JSON.stringify(summary, null, 2));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : "Unknown setup failure");
  process.exitCode = 1;
});
