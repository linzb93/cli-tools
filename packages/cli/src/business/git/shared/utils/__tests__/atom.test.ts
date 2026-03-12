import { describe, expect, test } from 'vitest';
import { fmtCommitMsg } from '../atom';

describe('fmtCommitMsg', () => {
    test('default to feat:update if empty', () => {
        expect(fmtCommitMsg('')).toBe('feat:update');
        expect(fmtCommitMsg('   ')).toBe('feat:update');
    });

    test('keep existing type prefix', () => {
        expect(fmtCommitMsg('feat: new feature')).toBe('feat:-new-feature');
        expect(fmtCommitMsg('fix: bug fix')).toBe('fix:-bug-fix');
        expect(fmtCommitMsg('docs: update readme')).toBe('docs:-update-readme');
    });

    test('add feat prefix for unknown keywords', () => {
        expect(fmtCommitMsg('some random message')).toBe('feat:some-random-message');
    });

    test('detect fix keywords', () => {
        expect(fmtCommitMsg('修复了一个bug')).toBe('fix:修复了一个bug');
        expect(fmtCommitMsg('解决问题')).toBe('fix:解决问题');
        expect(fmtCommitMsg('issue #123')).toBe('fix:issue-#123');
    });

    test('detect feat keywords', () => {
        expect(fmtCommitMsg('新增功能')).toBe('feat:新增功能');
        expect(fmtCommitMsg('添加模块')).toBe('feat:添加模块');
        expect(fmtCommitMsg('implement user login')).toBe('feat:implement-user-login');
    });

    test('detect docs keywords', () => {
        expect(fmtCommitMsg('更新文档')).toBe('docs:更新文档');
        expect(fmtCommitMsg('readme update')).toBe('docs:readme-update');
        expect(fmtCommitMsg('添加注释')).toBe('docs:添加注释');
    });

    test('detect style keywords', () => {
        expect(fmtCommitMsg('调整样式')).toBe('style:调整样式');
        expect(fmtCommitMsg('format code')).toBe('style:format-code');
        expect(fmtCommitMsg('eslint fix')).toBe('style:eslint-fix');
    });

    test('detect refactor keywords and replace prefix', () => {
        expect(fmtCommitMsg('重构代码')).toBe('refactor:重构代码'); // No separator
        expect(fmtCommitMsg('重构，代码结构')).toBe('refactor:代码结构');
        expect(fmtCommitMsg('优化 代码结构')).toBe('refactor:代码结构');
        expect(fmtCommitMsg('重构：代码重构')).toBe('refactor:代码重构');
        expect(fmtCommitMsg('代码重构')).toBe('refactor:代码重构');
    });

    test('detect perf keywords', () => {
        expect(fmtCommitMsg('提升性能')).toBe('perf:提升性能');
        expect(fmtCommitMsg('speed up')).toBe('perf:speed-up');
    });

    test('detect test keywords', () => {
        expect(fmtCommitMsg('添加测试用例')).toBe('test:添加测试用例');
        expect(fmtCommitMsg('unit test')).toBe('test:unit-test');
    });

    test('detect build keywords', () => {
        expect(fmtCommitMsg('升级依赖')).toBe('build:升级依赖');
        expect(fmtCommitMsg('npm install')).toBe('build:npm-install');
    });

    test('detect ci keywords', () => {
        expect(fmtCommitMsg('ci config')).toBe('ci:ci-config');
        expect(fmtCommitMsg('github actions')).toBe('ci:github-actions');
    });

    test('detect chore keywords', () => {
        expect(fmtCommitMsg('修改配置')).toBe('chore:修改配置');
        expect(fmtCommitMsg('.gitignore')).toBe('chore:.gitignore');
    });

    test('detect revert keywords', () => {
        expect(fmtCommitMsg('回滚代码')).toBe('revert:回滚代码');
        expect(fmtCommitMsg('undo changes')).toBe('revert:undo-changes');
    });

    test('priority check', () => {
        // "修复功能" -> fix (修复) vs feat (功能)
        expect(fmtCommitMsg('修复功能')).toBe('fix:修复功能');

        // "文档样式" -> docs (文档) vs style (样式)
        // docs is before style in array
        expect(fmtCommitMsg('文档样式')).toBe('docs:文档样式');
    });
});
