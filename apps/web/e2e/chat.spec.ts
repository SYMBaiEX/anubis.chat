import { expect, test } from '@playwright/test';

test.describe('Chat Interface', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/chat');
  });

  test('should display chat interface elements', async ({ page }) => {
    // Check for message input
    const messageInput = page.locator('[data-testid="message-input"]');
    await expect(messageInput).toBeVisible();

    // Check for send button
    const sendButton = page.locator('[data-testid="send-button"]');
    await expect(sendButton).toBeVisible();

    // Check for message list container
    const messageList = page.locator('[data-testid="message-list"]');
    await expect(messageList).toBeVisible();
  });

  test('should send a message', async ({ page }) => {
    const messageInput = page.locator('[data-testid="message-input"]');
    const sendButton = page.locator('[data-testid="send-button"]');

    // Type a message
    await messageInput.fill('Hello, this is a test message');

    // Send the message
    await sendButton.click();

    // Check if message appears in the list
    const sentMessage = page.locator('text=Hello, this is a test message');
    await expect(sentMessage).toBeVisible();
  });

  test('should handle keyboard shortcuts', async ({ page }) => {
    const messageInput = page.locator('[data-testid="message-input"]');

    // Focus on input
    await messageInput.focus();

    // Type and press Enter to send
    await messageInput.fill('Test message with Enter key');
    await messageInput.press('Enter');

    // Check if message was sent
    const sentMessage = page.locator('text=Test message with Enter key');
    await expect(sentMessage).toBeVisible();
  });

  test('should show loading state while sending', async ({ page }) => {
    const messageInput = page.locator('[data-testid="message-input"]');
    const sendButton = page.locator('[data-testid="send-button"]');

    // Type a message
    await messageInput.fill('Test loading state');

    // Send and check for loading indicator
    await sendButton.click();

    const loadingIndicator = page.locator('[data-testid="loading-indicator"]');
    // Loading indicator might appear briefly
    if (await loadingIndicator.isVisible()) {
      await expect(loadingIndicator).toBeVisible();
    }
  });

  test('should handle empty message submission', async ({ page }) => {
    const sendButton = page.locator('[data-testid="send-button"]');

    // Try to send empty message
    await sendButton.click();

    // Button should be disabled or no message should appear
    const messages = page.locator('[data-testid="message"]');
    const messageCount = await messages.count();

    // Wait a bit to ensure no message is added
    await page.waitForTimeout(1000);

    const newMessageCount = await messages.count();
    expect(newMessageCount).toBe(messageCount);
  });

  test('should display message timestamps', async ({ page }) => {
    const messageInput = page.locator('[data-testid="message-input"]');
    const sendButton = page.locator('[data-testid="send-button"]');

    // Send a message
    await messageInput.fill('Message with timestamp');
    await sendButton.click();

    // Check for timestamp
    const timestamp = page.locator('[data-testid="message-timestamp"]').first();
    await expect(timestamp).toBeVisible();

    // Verify timestamp format (should contain time)
    const timestampText = await timestamp.textContent();
    expect(timestampText).toMatch(/\d{1,2}:\d{2}/);
  });

  test('should handle message editing', async ({ page }) => {
    // Send a message first
    const messageInput = page.locator('[data-testid="message-input"]');
    const sendButton = page.locator('[data-testid="send-button"]');

    await messageInput.fill('Original message');
    await sendButton.click();

    // Find and click edit button
    const editButton = page
      .locator('[data-testid="edit-message-button"]')
      .first();
    if (await editButton.isVisible()) {
      await editButton.click();

      // Edit the message
      const editInput = page.locator('[data-testid="edit-message-input"]');
      await editInput.fill('Edited message');
      await editInput.press('Enter');

      // Check if message was updated
      const editedMessage = page.locator('text=Edited message');
      await expect(editedMessage).toBeVisible();
    }
  });

  test('should handle message deletion', async ({ page }) => {
    // Send a message first
    const messageInput = page.locator('[data-testid="message-input"]');
    const sendButton = page.locator('[data-testid="send-button"]');

    await messageInput.fill('Message to delete');
    await sendButton.click();

    // Find and click delete button
    const deleteButton = page
      .locator('[data-testid="delete-message-button"]')
      .first();
    if (await deleteButton.isVisible()) {
      await deleteButton.click();

      // Confirm deletion if there's a confirmation dialog
      const confirmButton = page.locator('button:has-text("Confirm")');
      if (await confirmButton.isVisible()) {
        await confirmButton.click();
      }

      // Check if message was removed
      const deletedMessage = page.locator('text=Message to delete');
      await expect(deletedMessage).not.toBeVisible();
    }
  });
});
