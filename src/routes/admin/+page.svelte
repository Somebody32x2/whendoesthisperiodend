<script lang="ts">
    // Admin shell: login -> pick school -> edit config. All state lives here;
    // ConfigEditor owns the draft/save/validation once a school is picked.
    import {onMount} from "svelte";
    import {base} from "$app/paths";
    import {fetchSchoolConfig, fetchSchools} from "$lib/client/api";
    import type {SchoolConfig, SchoolSummary} from "$lib/config/types";
    import ConfigEditor from "$lib/components/admin/ConfigEditor.svelte";

    type Stage = "loading" | "login" | "pick" | "edit";

    let stage = $state<Stage>("loading");
    let schools = $state<SchoolSummary[]>([]);
    let scope = $state<string | null>(null);

    // Login form
    let loginSchoolId = $state("");
    let loginPassword = $state("");
    let loginError = $state("");
    let loggingIn = $state(false);

    // Pick stage
    let pickError = $state("");
    let newId = $state("");
    let newName = $state("");
    let creating = $state(false);
    let loadingConfig = $state(false);

    // Edit stage
    let editingSchool = $state("");
    let editingConfig = $state<SchoolConfig | null>(null);

    const visibleSchools = $derived(scope === "*" ? schools : schools.filter(s => s.id === scope));

    async function loadSchools() {
        try {
            schools = await fetchSchools();
        } catch {
            schools = [];
        }
    }

    onMount(async () => {
        await loadSchools();
        try {
            const res = await fetch(`${base}/api/auth/me`, {cache: "no-store"});
            const data = await res.json();
            if (data.authenticated) {
                scope = data.scope;
                stage = "pick";
                return;
            }
        } catch { /* fall through to login */
        }
        if (!loginSchoolId && schools[0]) loginSchoolId = schools[0].id;
        stage = "login";
    });

    async function doLogin() {
        if (!loginSchoolId || !loginPassword || loggingIn) return;
        loginError = "";
        loggingIn = true;
        try {
            const res = await fetch(`${base}/api/auth/login`, {
                method: "POST",
                headers: {"content-type": "application/json"},
                body: JSON.stringify({school: loginSchoolId, password: loginPassword})
            });
            const data = await res.json();
            if (!res.ok || !data.ok) {
                loginError = data.error ?? "Login failed.";
                return;
            }
            scope = data.scope;
            loginPassword = "";
            await loadSchools();
            stage = "pick";
        } catch (e) {
            loginError = e instanceof Error ? e.message : String(e);
        } finally {
            loggingIn = false;
        }
    }

    function handleLoginKeydown(e: KeyboardEvent) {
        if (e.key === "Enter") {
            e.preventDefault();
            void doLogin();
        }
    }

    async function pickSchool(id: string) {
        pickError = "";
        loadingConfig = true;
        try {
            editingConfig = await fetchSchoolConfig(id);
            editingSchool = id;
            stage = "edit";
        } catch (e) {
            pickError = e instanceof Error ? e.message : String(e);
        } finally {
            loadingConfig = false;
        }
    }

    async function createSchool() {
        if (creating) return;
        pickError = "";
        creating = true;
        try {
            const res = await fetch(`${base}/api/schools`, {
                method: "POST",
                headers: {"content-type": "application/json"},
                body: JSON.stringify({id: newId.trim(), name: newName.trim()})
            });
            const data = await res.json();
            if (!res.ok || !data.ok) {
                pickError = data.errors ? data.errors.join("; ") : (data.error ?? "Failed to create school.");
                return;
            }
            editingConfig = data.config;
            editingSchool = data.config.id;
            newId = "";
            newName = "";
            await loadSchools();
            stage = "edit";
        } catch (e) {
            pickError = e instanceof Error ? e.message : String(e);
        } finally {
            creating = false;
        }
    }

    async function logout() {
        try {
            await fetch(`${base}/api/auth/logout`, {method: "POST"});
        } catch { /* ignore */
        }
        scope = null;
        editingConfig = null;
        editingSchool = "";
        loginPassword = "";
        stage = "login";
    }

    function backToPick() {
        stage = "pick";
        editingConfig = null;
        editingSchool = "";
    }
</script>

<div class="min-h-screen w-full dark:bg-gray-800 dark:text-white">
    <div class="max-w-5xl mx-auto px-4 py-8">
        <h1 class="text-2xl font-black mb-6">Schedule Admin</h1>

        {#if stage === "loading"}
            <p class="opacity-70">Loading…</p>
        {:else if stage === "login"}
            <div class="max-w-sm mx-auto mt-16 rounded-lg border border-gray-300 dark:border-gray-500 p-6 space-y-3">
                <h2 class="text-lg font-bold mb-2">Log in</h2>
                <label class="block text-sm">
                    School
                    <select bind:value={loginSchoolId}
                            class="mt-1 w-full rounded border border-gray-300 dark:border-gray-500 bg-transparent dark:bg-gray-700 px-2 py-1 text-sm">
                        {#each schools as school (school.id)}
                            <option value={school.id}>{school.name}</option>
                        {/each}
                        <option value="*">(global key)</option>
                    </select>
                </label>
                <label class="block text-sm">
                    Password
                    <input type="password" bind:value={loginPassword} onkeydown={handleLoginKeydown}
                           class="mt-1 w-full rounded border border-gray-300 dark:border-gray-500 bg-transparent px-2 py-1 text-sm"/>
                </label>
                <p class="text-xs opacity-60">Use your school password, or the global key.</p>
                {#if loginError}
                    <p class="text-sm text-red-500">{loginError}</p>
                {/if}
                <button type="button" onclick={doLogin} disabled={loggingIn || !loginSchoolId || !loginPassword}
                        class="w-full rounded bg-blue-600 disabled:opacity-50 text-white py-1.5 text-sm hover:bg-blue-700">
                    {loggingIn ? "Logging in…" : "Log in"}
                </button>
            </div>
        {:else if stage === "pick"}
            <div class="flex items-center justify-between mb-4">
                <p class="text-sm opacity-70">Signed in as {scope === "*" ? "global admin" : scope}</p>
                <button type="button" onclick={logout}
                        class="text-sm rounded border border-gray-300 dark:border-gray-500 px-3 py-1 hover:bg-gray-100 dark:hover:bg-gray-700">
                    Log out
                </button>
            </div>

            {#if pickError}
                <p class="text-sm text-red-500 mb-3">{pickError}</p>
            {/if}

            <div class="space-y-2 mb-8">
                {#if loadingConfig}
                    <p class="opacity-70 text-sm">Loading…</p>
                {/if}
                {#each visibleSchools as school (school.id)}
                    <button type="button" onclick={() => pickSchool(school.id)} disabled={loadingConfig}
                            class="w-full text-left rounded-lg border border-gray-300 dark:border-gray-500 px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50">
                        <span class="font-semibold">{school.name}</span>
                        <span class="ml-2 text-xs opacity-60">{school.id}</span>
                    </button>
                {/each}
                {#if visibleSchools.length === 0}
                    <p class="text-sm opacity-60">No editable schools.</p>
                {/if}
            </div>

            {#if scope === "*"}
                <div class="rounded-lg border border-dashed border-gray-400 dark:border-gray-500 p-4">
                    <h2 class="font-bold mb-2">New school</h2>
                    <div class="flex flex-wrap gap-2 items-end">
                        <label class="text-sm">Id
                            <input type="text" bind:value={newId} pattern={"[A-Za-z0-9-]{1,32}"} placeholder="new-school"
                                   class="block mt-1 rounded border border-gray-300 dark:border-gray-500 bg-transparent px-2 py-1 text-sm"/>
                        </label>
                        <label class="text-sm">Name
                            <input type="text" bind:value={newName} placeholder="New School"
                                   class="block mt-1 rounded border border-gray-300 dark:border-gray-500 bg-transparent px-2 py-1 text-sm"/>
                        </label>
                        <button type="button" onclick={createSchool} disabled={creating || !newId || !newName}
                                class="rounded bg-blue-600 disabled:opacity-50 text-white px-3 py-1.5 text-sm hover:bg-blue-700">
                            {creating ? "Creating…" : "Create"}
                        </button>
                    </div>
                </div>
            {/if}
        {:else if stage === "edit" && editingConfig}
            <ConfigEditor school={editingSchool} initial={editingConfig} onback={backToPick}/>
        {/if}
    </div>
</div>
