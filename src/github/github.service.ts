import { Injectable } from '@nestjs/common';
import { Octokit } from '@octokit/rest';
import * as NodeCache from 'node-cache';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class GithubService {
  private octokit: Octokit;
  private cache = new NodeCache({ stdTTL: 86400 });

  constructor(private configService: ConfigService) {
    this.octokit = new Octokit({
      auth: configService.get('TOKEN_GITHUB'),
    });
    console.log('TOKEN_GITHUB', configService.get('TOKEN_GITHUB'));
    
  }

  async getUserRepos(username: string, perPage: number): Promise<any> {
    const cacheKey = `repos_${username}_${perPage}`;
    const cachedData = this.cache.get(cacheKey);

    if (cachedData) {
      return cachedData;
    }

    try {
      const response = await this.octokit.rest.repos.listForUser({
        username,
        per_page: perPage,
        sort: 'created',
        direction: 'desc',
      });
      const repos = response.data.map((repo) => ({
        name: repo.name,
        description: repo.description || 'Pas de description disponible',
        owner: repo.owner.login,
        html_url: repo.html_url,
      }));

      this.cache.set(cacheKey, repos); // Mettre en cache les résultats

      return repos;
    } catch (error) {
      throw new Error(
        `Erreur lors de la récupération des dépôts : ${error.message}`,
      );
    }
  }

  async getUserCommitsPerMonth(username: string): Promise<any> {
    const cacheKey = `commits_${username}`;
    const cachedData = this.cache.get(cacheKey);
    
    if (cachedData) {
      return cachedData;
    }

    try {
      const repos = await this.getUserRepos(username, 10);
      const commitsPerMonth = {};
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

      for (const repo of repos) {
        try {
          const commits = await this.octokit.rest.repos.listCommits({
            owner: username,
            repo: repo.name,
            per_page: 100,
            since: sixMonthsAgo.toISOString(),
          });

          for (const commit of commits.data) {
            const month = new Date(commit.commit.author.date).getMonth() + 1;
            const year = new Date(commit.commit.author.date).getFullYear();
            const key = `${year}-${month}`;

            if (!commitsPerMonth[key]) {
              commitsPerMonth[key] = 0;
            }
            commitsPerMonth[key]++;
          }
        } catch (repoError) {
          if (repoError.message.includes('Git Repository is empty')) {
            console.warn(`Le dépôt ${repo.name} est vide, il sera ignoré.`);
            continue;
          } else {
            throw repoError;
          }
        }
      }

      this.cache.set(cacheKey, commitsPerMonth); // Mettre en cache les résultats

      return commitsPerMonth;
    } catch (error) {
      throw new Error(
        `Erreur lors de la récupération des commits : ${error.message}`,
      );
    }
  }

  async getTopLanguages(username: string): Promise<any> {
    const cacheKey = `topLanguages_${username}`;
    const cachedData = this.cache.get(cacheKey);

    if (cachedData) {
      return cachedData;
    }

    try {
      const repos = await this.getUserRepos(username, 100);
      const languageCount = {};
      let totalBytes = 0;

      for (const repo of repos) {
        const response = await this.octokit.rest.repos.listLanguages({
          owner: username,
          repo: repo.name,
        });

        for (const [language, count] of Object.entries(response.data)) {
          if (!languageCount[language]) {
            languageCount[language] = 0;
          }
          languageCount[language] += count;
          totalBytes += count;
        }
      }

      const sortedLanguages = Object.entries(languageCount).sort(
        (a, b) => Number(b[1]) - Number(a[1]),
      );
      const topLanguages = sortedLanguages
        .slice(0, 4)
        .map(([language, count]) => ({
          language,
          percentage: (((count as number) / totalBytes) * 100).toFixed(2) + '%',
        }));

      this.cache.set(cacheKey, topLanguages);

      return topLanguages;
    } catch (error) {
      throw new Error(
        `Erreur lors de la récupération des langages : ${error.message}`,
      );
    }
  }
}
