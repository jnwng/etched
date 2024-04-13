import { matter } from 'vfile-matter';
import type { VFile } from 'vfile';
import type { Node } from 'unist';

export default function remarkMatterPlugin() {
  return function (tree: Node, file: VFile) {
    matter(file); // After this call, file is assumed to be mutated to fit EnhancedVFile structure
  };
}
