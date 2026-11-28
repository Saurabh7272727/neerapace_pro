import { cacheAside, cacheDel } from "../../config/redis.js";
import { cacheKeys } from "../../config/cacheKeys.js";
import { Page, Program, GalleryItem, Banner, Enquiry, Announcement } from "../../models/index.js";
import { ApiError } from "../../utils/ApiError.js";
import { presentProgram } from "../../utils/presenters.js";
import { sanitizePlain, sanitizeRichText } from "../../utils/sanitize.js";
import { pageQuery } from "../../utils/http.js";
import { deleteAcademyImage } from "../../utils/cloudinaryAssets.js";

function presentPage(page) {
  return {
    slug: page.slug,
    title: page.title,
    heroTitle: page.heroTitle || "",
    heroSubtitle: page.heroSubtitle || "",
    bodyHtml: page.bodyHtml || "",
    published: page.published,
  };
}

export async function getPublicPage(slug) {
  return cacheAside(cacheKeys.page(slug), 600, async () => {
    const page = await Page.findOne({ slug, published: true }).lean();
    if (!page) throw new ApiError(404, "NOT_FOUND", "That page is not available");
    return presentPage(page);
  });
}

export async function listPages() {
  const pages = await Page.find().sort({ slug: 1 }).lean();
  return pages.map(presentPage);
}

export async function updatePage(slug, input) {
  const page = await Page.findOneAndUpdate(
    { slug },
    {
      title: sanitizePlain(input.title),
      heroTitle: sanitizePlain(input.heroTitle || ""),
      heroSubtitle: sanitizePlain(input.heroSubtitle || ""),
      bodyHtml: sanitizeRichText(input.bodyHtml || ""),
      published: input.published,
    },
    { new: true },
  );
  if (!page) throw new ApiError(404, "NOT_FOUND", "That page does not exist");
  await cacheDel(cacheKeys.page(slug));
  return presentPage(page);
}

export async function listPublicPrograms() {
  return cacheAside(cacheKeys.programs, 600, async () => {
    const programs = await Program.find({ isPublished: true }).sort({ sortOrder: 1, name: 1 }).lean();
    return programs.map(presentProgram);
  });
}

export async function listAllPrograms() {
  const programs = await Program.find().sort({ sortOrder: 1, name: 1 }).lean();
  return programs.map(presentProgram);
}

export async function createProgram(input) {
  const program = await Program.create({ ...input, name: sanitizePlain(input.name), description: sanitizePlain(input.description) });
  await cacheDel(cacheKeys.programs);
  return presentProgram(program);
}

export async function updateProgram(id, input) {
  const program = await Program.findByIdAndUpdate(
    id,
    { ...input, name: sanitizePlain(input.name), description: sanitizePlain(input.description) },
    { new: true },
  );
  if (!program) throw new ApiError(404, "NOT_FOUND", "Program not found");
  await cacheDel(cacheKeys.programs);
  return presentProgram(program);
}

export async function removeProgram(id) {
  const program = await Program.findById(id);
  if (!program) throw new ApiError(404, "NOT_FOUND", "Program not found");
  await deleteAcademyImage(program.imagePublicId, "programs");
  await Program.deleteOne({ _id: program._id });
  await cacheDel(cacheKeys.programs);
  return { ok: true };
}

export async function listPublicGallery() {
  return cacheAside(cacheKeys.gallery, 600, async () => {
    const items = await GalleryItem.find({ published: true }).sort({ sortOrder: 1, createdAt: -1 }).lean();
    return items.map(presentGallery);
  });
}

export async function listGallery() {
  const items = await GalleryItem.find().sort({ sortOrder: 1, createdAt: -1 }).lean();
  return items.map(presentGallery);
}

function presentGallery(item) {
  return {
    id: String(item._id),
    imageUrl: item.imageUrl,
    publicId: item.publicId || "",
    caption: item.caption || "",
    album: item.album || "Academy",
    sortOrder: item.sortOrder || 0,
    published: item.published,
  };
}

export async function createGalleryItem(input) {
  const item = await GalleryItem.create({ ...input, caption: sanitizePlain(input.caption || ""), album: sanitizePlain(input.album || "Academy") });
  await cacheDel(cacheKeys.gallery);
  return presentGallery(item);
}

export async function updateGalleryItem(id, input) {
  const item = await GalleryItem.findByIdAndUpdate(
    id,
    { ...input, caption: sanitizePlain(input.caption || ""), album: sanitizePlain(input.album || "Academy") },
    { new: true },
  );
  if (!item) throw new ApiError(404, "NOT_FOUND", "Gallery item not found");
  await cacheDel(cacheKeys.gallery);
  return presentGallery(item);
}

export async function removeGalleryItem(id) {
  const item = await GalleryItem.findById(id);
  if (!item) throw new ApiError(404, "NOT_FOUND", "Gallery item not found");
  await deleteAcademyImage(item.publicId, "gallery");
  await GalleryItem.deleteOne({ _id: item._id });
  await cacheDel(cacheKeys.gallery);
  return { ok: true, publicId: item.publicId || "" };
}

function presentBanner(item) {
  return {
    id: String(item._id),
    imageUrl: item.imageUrl,
    publicId: item.publicId || "",
    caption: item.caption || "",
    playerName: item.playerName || "",
    tag: item.tag || "",
    country: item.country || "",
    teamName: item.teamName || "",
    sortOrder: item.sortOrder || 0,
    published: item.published,
  };
}

export async function listPublicBanners() {
  return cacheAside(cacheKeys.banners, 600, async () => {
    const items = await Banner.find({ published: true }).sort({ sortOrder: 1, createdAt: -1 }).lean();
    return items.map(presentBanner);
  });
}

export async function listBanners() {
  const items = await Banner.find().sort({ sortOrder: 1, createdAt: -1 }).lean();
  return items.map(presentBanner);
}

function cleanBannerInput(input) {
  return {
    ...input,
    caption: sanitizePlain(input.caption),
    playerName: sanitizePlain(input.playerName),
    tag: sanitizePlain(input.tag || ""),
    country: sanitizePlain(input.country || ""),
    teamName: sanitizePlain(input.teamName || ""),
  };
}

export async function createBanner(input) {
  if (await Banner.countDocuments() >= 5) {
    throw new ApiError(409, "BANNER_LIMIT", "The homepage can show up to five banners. Delete one before adding another.");
  }
  const cleanInput = cleanBannerInput(input);
  for (let slot = 0; slot < 5; slot += 1) {
    try {
      const item = await Banner.create({ ...cleanInput, slot });
      await cacheDel(cacheKeys.banners);
      return presentBanner(item);
    } catch (error) {
      if (error?.code !== 11000) throw error;
    }
  }
  throw new ApiError(409, "BANNER_LIMIT", "The homepage can show up to five banners. Delete one before adding another.");
}

export async function updateBanner(id, input) {
  const item = await Banner.findByIdAndUpdate(id, cleanBannerInput(input), { new: true, runValidators: true });
  if (!item) throw new ApiError(404, "NOT_FOUND", "Banner not found");
  await cacheDel(cacheKeys.banners);
  return presentBanner(item);
}

export async function removeBanner(id) {
  const item = await Banner.findById(id);
  if (!item) throw new ApiError(404, "NOT_FOUND", "Banner not found");
  await deleteAcademyImage(item.publicId, "banners");
  await Banner.deleteOne({ _id: item._id });
  await cacheDel(cacheKeys.banners);
  return { ok: true, publicId: item.publicId || "" };
}

export async function createEnquiry(input) {
  const enquiry = await Enquiry.create({
    name: sanitizePlain(input.name),
    email: input.email,
    phone: input.phone || "",
    message: sanitizePlain(input.message),
  });
  return { id: String(enquiry.id) };
}

export async function listEnquiries(query) {
  const { page, limit, skip } = pageQuery(query);
  const filter = query.status ? { status: query.status } : {};
  const [items, total] = await Promise.all([
    Enquiry.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    Enquiry.countDocuments(filter),
  ]);
  return {
    items: items.map((item) => ({
      id: String(item._id),
      name: item.name,
      email: item.email,
      phone: item.phone,
      message: item.message,
      status: item.status,
      createdAt: item.createdAt,
    })),
    meta: { page, limit, total },
  };
}

export async function updateEnquiry(id, status) {
  const enquiry = await Enquiry.findByIdAndUpdate(id, { status }, { new: true });
  if (!enquiry) throw new ApiError(404, "NOT_FOUND", "Enquiry not found");
  return { id: String(enquiry.id), status: enquiry.status };
}

export async function listPublicAnnouncements() {
  return cacheAside(cacheKeys.announcements, 300, async () => {
    const items = await Announcement.find({ publishedAt: { $ne: null }, audience: "all" }).sort({ publishedAt: -1 }).limit(6).lean();
    return items.map(presentAnnouncement);
  });
}

function presentAnnouncement(item) {
  return {
    id: String(item._id),
    title: item.title,
    body: item.body,
    audience: item.audience,
    batchId: item.batchId ? String(item.batchId) : null,
    publishedAt: item.publishedAt,
    createdAt: item.createdAt,
  };
}

export { presentAnnouncement };
