/**
 * Cleanup script to remove all public agents except Anubis
 * This will keep only one active Anubis agent and deactivate all others
 */

import { mutation } from './_generated/server';

export const cleanupDuplicateAgents = mutation({
  args: {},
  handler: async (ctx) => {
    // Get all public agents
    const publicAgents = await ctx.db
      .query('agents')
      .withIndex('by_public', (q) => q.eq('isPublic', true))
      .collect();

    console.log(`Found ${publicAgents.length} public agents`);

    // Find the main Anubis agent (the one that's active)
    const anubisAgents = publicAgents.filter(agent => agent.name === 'Anubis' && agent.isActive);
    const mainAnubis = anubisAgents.length > 0 ? anubisAgents[0] : null;

    if (!mainAnubis) {
      console.log('No active Anubis agent found');
      return 'No active Anubis agent found';
    }

    console.log(`Keeping Anubis agent: ${mainAnubis._id}`);

    // Deactivate all other public agents
    let deactivatedCount = 0;
    for (const agent of publicAgents) {
      if (agent._id !== mainAnubis._id) {
        await ctx.db.patch(agent._id, {
          isActive: false,
          updatedAt: Date.now(),
        });
        deactivatedCount++;
        console.log(`Deactivated agent: ${agent.name} (${agent._id})`);
      }
    }

    return `Cleanup complete: Kept 1 Anubis agent, deactivated ${deactivatedCount} other agents`;
  },
});

export const removeInactivePublicAgents = mutation({
  args: {},
  handler: async (ctx) => {
    // Get all inactive public agents
    const inactiveAgents = await ctx.db
      .query('agents')
      .withIndex('by_public', (q) => q.eq('isPublic', true))
      .filter((q) => q.eq(q.field('isActive'), false))
      .collect();

    console.log(`Found ${inactiveAgents.length} inactive public agents to remove`);

    // Delete all inactive public agents
    let deletedCount = 0;
    for (const agent of inactiveAgents) {
      await ctx.db.delete(agent._id);
      deletedCount++;
      console.log(`Deleted agent: ${agent.name} (${agent._id})`);
    }

    return `Deleted ${deletedCount} inactive public agents`;
  },
});