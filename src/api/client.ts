/**
 * Hand-written JSON:API client for the Productive API (ADR-0002).
 *
 * Endpoint facts and the response bodies these rules were derived from live in
 * `docs/api/README.md` and `docs/api/samples/`. Constraints: `.claude/rules/api-client.md`.
 */

const JSON_API_MEDIA_TYPE = 'application/vnd.api+json';

/** Credentials travel as an argument, never as module state (ADR-0004). */
export interface Auth {
	token: string;
	organizationId: string;
}

export interface ResourceIdentifier {
	type: string;
	id: string;
}

/**
 * A relationship the request did not `include` arrives as `{ meta: { included: false } }` - with no
 * `data` key at all. Absent `data` means "not requested", never "no related record".
 */
export interface Relationship {
	data?: ResourceIdentifier | ResourceIdentifier[] | null;
	meta?: { included?: boolean };
}

export interface Resource {
	id: string;
	type: string;
	/** Absent when the request asked only for relationships via `fields`. */
	attributes?: Record<string, unknown>;
	relationships?: Record<string, Relationship>;
}

export interface PageMeta {
	current_page: number;
	total_pages: number;
	total_count: number;
	page_size: number;
	max_page_size: number;
}

export interface JsonApiDocument {
	data: Resource | Resource[];
	included?: Resource[];
	meta?: Partial<PageMeta>;
}

export interface ApiErrorDetail {
	code: string | null;
	title: string | null;
	detail: string | null;
	pointer: string | null;
}

/**
 * Thrown for every non-2xx response, and for a transport failure (status 0).
 *
 * `status` is the HTTP status. The wire's own `errors[].status` is deliberately dropped: it is
 * sometimes a slug ("unprocessable_content") that disagrees with the transport status.
 */
export class ApiError extends Error {
	readonly status: number;
	readonly errors: ApiErrorDetail[];

	constructor(status: number, errors: ApiErrorDetail[], message: string) {
		super(message);
		this.name = 'ApiError';
		this.status = status;
		this.errors = errors;
	}

	/** The first error's `code`, which is what callers branch on. */
	get code(): string | null {
		return this.errors[0]?.code ?? null;
	}
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null;
}

function asString(value: unknown): string | null {
	return typeof value === 'string' ? value : null;
}

export function parseErrors(body: unknown): ApiErrorDetail[] {
	if (!isRecord(body) || !Array.isArray(body.errors)) return [];

	return body.errors.filter(isRecord).map((error) => ({
		code: asString(error.code),
		title: asString(error.title),
		detail: asString(error.detail),
		// JSON:API specifies a leading slash here; Productive omits it ("data/attributes/person").
		pointer: isRecord(error.source) ? asString(error.source.pointer) : null,
	}));
}

export function toApiError(status: number, body: unknown): ApiError {
	const errors = parseErrors(body);
	const message = errors[0]?.detail ?? errors[0]?.title ?? `Productive API request failed (${String(status)}).`;

	return new ApiError(status, errors, message);
}

/** 204 carries no body and no Content-Type, so parsing unconditionally would throw. */
async function readBody(response: Response): Promise<unknown> {
	const text = await response.text();
	if (text.trim() === '') return null;

	try {
		return JSON.parse(text) as unknown;
	} catch {
		return null;
	}
}

/**
 * Issues one request. No retry, no caching, no deduplication - TanStack Query owns all three.
 * Resolves to `null` for 204.
 */
export async function request(auth: Auth, path: string, init: RequestInit = {}): Promise<JsonApiDocument | null> {
	let response: Response;
	let body: unknown;

	try {
		// Header construction is inside the try on purpose: the token is typed on the login screen
		// (R-1), and `Headers.set` throws on a value carrying a newline or a non-Latin-1 character.
		const headers = new Headers(init.headers);
		headers.set('X-Auth-Token', auth.token);
		headers.set('X-Organization-Id', auth.organizationId);
		headers.set('Accept', JSON_API_MEDIA_TYPE);
		if (init.body !== undefined) headers.set('Content-Type', JSON_API_MEDIA_TYPE);

		response = await fetch(`${import.meta.env.VITE_API_BASE_URL}${path}`, { ...init, headers });

		if (response.status === 204) return null;

		// Reading the body can reject on a truncated response, not only on malformed JSON.
		body = await readBody(response);
	} catch (cause) {
		if (cause instanceof ApiError) throw cause;

		// Nothing may leave this function as a raw TypeError.
		throw new ApiError(0, [], 'Could not reach the Productive API. Check your connection.');
	}

	if (!response.ok) throw toApiError(response.status, body);

	if (!isRecord(body) || !('data' in body)) {
		throw new ApiError(response.status, [], 'The Productive API returned an unreadable response.');
	}

	// Shape is guarded above; interfaces carry no index signature, hence the widening hop.
	return body as unknown as JsonApiDocument;
}

export function requireDocument(document: JsonApiDocument | null): JsonApiDocument {
	if (document === null) {
		throw new ApiError(204, [], 'The Productive API returned no content where a record was expected.');
	}

	return document;
}

/**
 * Walks a paged collection to the end. An empty collection reports `total_pages: 0`, so the guard
 * is `current_page < total_pages` rather than `total_pages > 1`.
 *
 * Each page is returned as its own document because `included` is per-page - resolving a
 * relationship means looking inside the page the resource came from.
 */
export async function requestAllPages(auth: Auth, buildPath: (page: number) => string): Promise<JsonApiDocument[]> {
	const documents: JsonApiDocument[] = [];

	// Driven by the local counter, never by the echoed `current_page`: a response that omits it
	// would otherwise pin the loop on one page forever.
	for (let page = 1; page <= MAX_PAGES; page += 1) {
		const document = requireDocument(await request(auth, buildPath(page)));
		documents.push(document);

		if (page >= readPageMeta(document).total_pages) return documents;
	}

	throw new ApiError(0, [], `The Productive API returned more than ${String(MAX_PAGES)} pages.`);
}

export function listResources(document: JsonApiDocument): Resource[] {
	return Array.isArray(document.data) ? document.data : [document.data];
}

export function readResource(document: JsonApiDocument): Resource {
	const [resource] = listResources(document);
	if (resource === undefined) {
		throw new ApiError(200, [], 'The Productive API returned an empty record.');
	}

	return resource;
}

/**
 * Resolves a to-one relationship to its ID. Returns null in three cases the caller cannot tell
 * apart - not requested, explicitly null, or to-many - so never surface it to a user as "none".
 */
export function readRelationshipId(resource: Resource, name: string): string | null {
	const data = resource.relationships?.[name]?.data;
	if (data === undefined || data === null || Array.isArray(data)) return null;

	return data.id;
}

export function findIncluded(document: JsonApiDocument, type: string, id: string | null): Resource | undefined {
	if (id === null) return undefined;

	return document.included?.find((resource) => resource.type === type && resource.id === id);
}

export function readPageMeta(document: JsonApiDocument): PageMeta {
	const meta = document.meta ?? {};

	return {
		current_page: meta.current_page ?? 1,
		total_pages: meta.total_pages ?? 0,
		total_count: meta.total_count ?? 0,
		page_size: meta.page_size ?? 0,
		max_page_size: meta.max_page_size ?? MAX_PAGE_SIZE,
	};
}

/** `meta.max_page_size` on every recorded collection. */
export const MAX_PAGE_SIZE = 200;

/** 200 entries a page: a day that needs more than this is a bug, not a big day. */
const MAX_PAGES = 50;

export function readAttributeString(resource: Resource, name: string): string | null {
	return asString(resource.attributes?.[name]);
}

export function readAttributeNumber(resource: Resource, name: string): number {
	const value = resource.attributes?.[name];

	return typeof value === 'number' ? value : 0;
}
