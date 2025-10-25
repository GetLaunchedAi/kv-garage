/**
 * Git Database Service
 * Uses GitHub API to store and retrieve data with version control
 */

const { Octokit } = require('@octokit/rest');

class GitDatabase {
  constructor() {
    this.octokit = new Octokit({
      auth: process.env.GITHUB_TOKEN
    });
    
    this.owner = process.env.GITHUB_OWNER;
    this.repo = process.env.GITHUB_REPO;
    this.branch = process.env.GITHUB_BRANCH || 'main';
  }

  /**
   * Get file content from GitHub repository
   */
  async getFile(filename) {
    try {
      const { data } = await this.octokit.repos.getContent({
        owner: this.owner,
        repo: this.repo,
        path: filename,
        ref: this.branch
      });

      const content = Buffer.from(data.content, 'base64').toString();
      return {
        content: JSON.parse(content),
        sha: data.sha
      };
    } catch (error) {
      if (error.status === 404) {
        // File doesn't exist, return empty structure
        return { content: { packs: [] }, sha: null };
      }
      throw error;
    }
  }

  /**
   * Update file content in GitHub repository
   */
  async updateFile(filename, data, message, sha = null) {
    try {
      const content = Buffer.from(JSON.stringify(data, null, 2)).toString('base64');
      
      const result = await this.octokit.repos.createOrUpdateFileContents({
        owner: this.owner,
        repo: this.repo,
        path: filename,
        message: message,
        content: content,
        sha: sha,
        branch: this.branch
      });

      return result.data;
    } catch (error) {
      console.error(`Error updating ${filename}:`, error);
      throw error;
    }
  }

  /**
   * Get all packs with version control
   */
  async getPacks() {
    const { content } = await this.getFile('packs.json');
    return content.packs || [];
  }

  /**
   * Create new pack with Git commit
   */
  async createPack(packData, userEmail) {
    try {
      // Get current data
      const { content: currentData, sha } = await this.getFile('packs.json');
      
      // Add new pack
      const newPack = {
        ...packData,
        id: Date.now().toString(),
        created_at: new Date().toISOString(),
        created_by: userEmail
      };
      
      currentData.packs.push(newPack);
      
      // Commit to Git
      await this.updateFile(
        'packs.json',
        currentData,
        `Add new pack: ${newPack.name} by ${userEmail}`,
        sha
      );
      
      return newPack;
    } catch (error) {
      console.error('Error creating pack:', error);
      throw error;
    }
  }

  /**
   * Update existing pack with Git commit
   */
  async updatePack(packId, updates, userEmail) {
    try {
      const { content: currentData, sha } = await this.getFile('packs.json');
      
      const packIndex = currentData.packs.findIndex(p => p.id === packId);
      if (packIndex === -1) {
        throw new Error('Pack not found');
      }
      
      // Update pack
      currentData.packs[packIndex] = {
        ...currentData.packs[packIndex],
        ...updates,
        updated_at: new Date().toISOString(),
        updated_by: userEmail
      };
      
      // Commit to Git
      await this.updateFile(
        'packs.json',
        currentData,
        `Update pack: ${currentData.packs[packIndex].name} by ${userEmail}`,
        sha
      );
      
      return currentData.packs[packIndex];
    } catch (error) {
      console.error('Error updating pack:', error);
      throw error;
    }
  }

  /**
   * Delete pack with Git commit
   */
  async deletePack(packId, userEmail) {
    try {
      const { content: currentData, sha } = await this.getFile('packs.json');
      
      const packIndex = currentData.packs.findIndex(p => p.id === packId);
      if (packIndex === -1) {
        throw new Error('Pack not found');
      }
      
      const deletedPack = currentData.packs[packIndex];
      currentData.packs.splice(packIndex, 1);
      
      // Commit to Git
      await this.updateFile(
        'packs.json',
        currentData,
        `Delete pack: ${deletedPack.name} by ${userEmail}`,
        sha
      );
      
      return deletedPack;
    } catch (error) {
      console.error('Error deleting pack:', error);
      throw error;
    }
  }

  /**
   * Get manifest for a pack
   */
  async getManifest(packId) {
    try {
      const { content } = await this.getFile(`manifests/${packId}.json`);
      return content;
    } catch (error) {
      if (error.status === 404) {
        return null;
      }
      throw error;
    }
  }

  /**
   * Upload manifest with Git commit
   */
  async uploadManifest(packId, manifestData, userEmail) {
    try {
      const manifestFile = `manifests/${packId}.json`;
      
      // Try to get existing manifest
      let sha = null;
      try {
        const { sha: existingSha } = await this.getFile(manifestFile);
        sha = existingSha;
      } catch (error) {
        // File doesn't exist, will create new one
      }
      
      // Update manifest
      await this.updateFile(
        manifestFile,
        manifestData,
        `Upload manifest for pack ${packId} by ${userEmail}`,
        sha
      );
      
      return manifestData;
    } catch (error) {
      console.error('Error uploading manifest:', error);
      throw error;
    }
  }

  /**
   * Get activity log with Git history
   */
  async getActivityLog(limit = 50) {
    try {
      const { data } = await this.octokit.repos.listCommits({
        owner: this.owner,
        repo: this.repo,
        per_page: limit
      });
      
      return data.map(commit => ({
        id: commit.sha,
        message: commit.commit.message,
        author: commit.commit.author.name,
        email: commit.commit.author.email,
        timestamp: commit.commit.author.date,
        url: commit.html_url
      }));
    } catch (error) {
      console.error('Error getting activity log:', error);
      throw error;
    }
  }

  /**
   * Get orders from Git repository
   */
  async getOrders() {
    try {
      const { content } = await this.getFile('orders.json');
      return content.orders || [];
    } catch (error) {
      console.error('Error getting orders:', error);
      return [];
    }
  }

  /**
   * Create new order with Git commit
   */
  async createOrder(orderData, userEmail) {
    try {
      const { content: currentData, sha } = await this.getFile('orders.json');
      
      const newOrder = {
        ...orderData,
        id: Date.now().toString(),
        created_at: new Date().toISOString(),
        created_by: userEmail,
        status: 'pending'
      };
      
      currentData.orders.push(newOrder);
      
      // Commit to Git
      await this.updateFile(
        'orders.json',
        currentData,
        `New order: ${newOrder.id} by ${userEmail}`,
        sha
      );
      
      return newOrder;
    } catch (error) {
      console.error('Error creating order:', error);
      throw error;
    }
  }

  /**
   * Update order status with Git commit
   */
  async updateOrderStatus(orderId, status, userEmail) {
    try {
      const { content: currentData, sha } = await this.getFile('orders.json');
      
      const orderIndex = currentData.orders.findIndex(o => o.id === orderId);
      if (orderIndex === -1) {
        throw new Error('Order not found');
      }
      
      currentData.orders[orderIndex].status = status;
      currentData.orders[orderIndex].updated_at = new Date().toISOString();
      currentData.orders[orderIndex].updated_by = userEmail;
      
      // Commit to Git
      await this.updateFile(
        'orders.json',
        currentData,
        `Update order ${orderId} status to ${status} by ${userEmail}`,
        sha
      );
      
      return currentData.orders[orderIndex];
    } catch (error) {
      console.error('Error updating order:', error);
      throw error;
    }
  }
}

module.exports = GitDatabase;
