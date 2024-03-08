/**
 * @typedef {import('unist').Node} Node
 * @typedef {import('vfile').VFile} VFile
 */

import { matter } from 'vfile-matter'

/**
 * Parse YAML frontmatter and expose it at `file.data.matter`.
 *
 * @returns
 *   Transform.
 */
export default function remarkMatterPlugin() {
  /**
   * Transform.
   *
   * @param {Node} tree
   *   Tree.
   * @param {VFile} file
   *   File.
   * @returns {undefined}
   *   Nothing.
   */
  return function (tree, file) {
    console.info({ tree, file })
    matter(file)
  }
}