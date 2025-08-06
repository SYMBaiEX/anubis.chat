# Migration Guide: .cursorrules to MDC Format (August 2025)

## ⚠️ Important Notice

The `.cursorrules` file format is **deprecated** and will be removed in future Cursor versions. This guide helps you migrate to the new MDC (Markdown Components) format.

## Migration Checklist

- [x] Created `.cursor/rules/` directory structure
- [x] Converted main rules to `main.mdc` with proper frontmatter
- [x] Added `cursor-config.mdc` with latest Cursor features
- [x] Updated AI models to August 2025 versions
- [ ] Removed deprecated `.cursorrules` file (after verification)

## Key Changes

### 1. File Location
- **Old**: `.cursorrules` in project root
- **New**: `.cursor/rules/*.mdc` files

### 2. File Format
- **Old**: Plain markdown or text
- **New**: MDC format with YAML frontmatter

### 3. Frontmatter Structure
```yaml
---
description: Brief description of the rule
globs: ["**/*.ts", "**/*.tsx"]  # File patterns (optional)
alwaysApply: false              # Default: false
---
```

### 4. Updated AI Models (August 2025)
- Claude 3.5 Sonnet (latest)
- GPT-4o
- DeepSeek v3 (updated from v2)
- Gemini 2.0 Flash (new)
- o1-mini / o1-preview (new reasoning models)

## Migration Steps

### Step 1: Create Directory Structure
```bash
mkdir -p .cursor/rules
```

### Step 2: Convert Main Rules
Move content from `.cursorrules` to `.cursor/rules/main.mdc`:
```yaml
---
description: Main project development rules
globs: ["**/*.ts", "**/*.tsx", "**/*.js", "**/*.jsx"]
alwaysApply: true
---

# Your existing rules content here
```

### Step 3: Organize by Category
Split large rule files into categories:
- `ai-rag/` - AI and RAG system rules
- `frontend/` - Frontend development
- `backend/` - Backend development
- `testing/` - Testing strategies
- `security/` - Security guidelines

### Step 4: Update Model References
Replace old model names:
- `gpt-4-turbo` → `gpt-4o`
- `deepseek-chat` → `deepseek-v3`
- Add: `gemini-2.0-flash`, `o1-mini`, `o1-preview`

### Step 5: Use Active Voice
Transform passive rules to active instructions:
- ❌ "TypeScript should be used"
- ✅ "You are a TypeScript expert. Always use strict mode."

### Step 6: Verify Migration
1. Open Cursor IDE
2. Test in Agent mode or Inline Edit
3. Check rules are applied correctly
4. Monitor for any issues

## File Examples

### Example: main.mdc
```yaml
---
description: ISIS Chat main development rules
globs: ["**/*.ts", "**/*.tsx"]
alwaysApply: true
---

# You are an expert full-stack developer

## Your expertise includes:
- TypeScript with strict mode
- React 19 and Next.js 15+
- AI/RAG systems
...
```

### Example: ai-rag/models.mdc
```yaml
---
description: AI model configuration and strategies
globs: ["**/services/ai/**", "**/lib/ai/**"]
alwaysApply: false
---

# AI Model Configuration

## Model Selection (August 2025)
...
```

## Benefits of Migration

1. **Better Organization**: Modular rules by category
2. **Scoped Rules**: Apply rules only to relevant files
3. **Version Control**: Better git diff with separate files
4. **Performance**: Faster rule processing with globs
5. **Future-Proof**: Compatible with upcoming Cursor features

## Validation

After migration, verify:
- [ ] Rules load in Agent mode
- [ ] Glob patterns match intended files
- [ ] No errors in Cursor console
- [ ] AI responses follow new rules
- [ ] Performance is maintained or improved

## Rollback Plan

If issues occur:
1. Keep `.cursorrules` file temporarily
2. Both formats work during transition period
3. Test thoroughly before removing old file
4. Report issues to Cursor forum

## Support

- Cursor Documentation: https://docs.cursor.com/context/rules
- Community Forum: https://forum.cursor.com
- GitHub Issues: https://github.com/getcursor/cursor/issues

## Next Steps

1. Complete migration for all rule files
2. Test thoroughly in development
3. Commit changes to version control
4. Remove `.cursorrules` after verification
5. Update team documentation

---

**Migration completed on**: August 6, 2025
**Cursor version**: Latest (Auto-updates enabled)
**Status**: ✅ Successfully migrated to MDC format