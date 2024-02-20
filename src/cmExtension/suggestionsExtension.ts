import {
  Decoration,
  EditorView,
  ViewPlugin,
  ViewUpdate,
  type DecorationSet,
  type PluginValue,
} from '@codemirror/view';
import { RangeSetBuilder } from '@codemirror/rangeset';
import { debounce, type Debouncer } from 'obsidian';
import nlp from 'compromise';

// import { showSuggestionsModal } from '../components/suggestionsPopup';


import './suggestionsExtension.css';

const underlineDecoration = (start: number, end: number, indexKeyword: string, entityClass: string) => {
  return Decoration.mark({
    class: entityClass,
    attributes: {
      'data-index-keyword': indexKeyword,
      'data-position-start': `${start}`,
      'data-position-end': `${end}`,
    },
  });
};
  // Decoration.mark({
  //   class: SuggestionCandidateClass,
  //   attributes: {
  //     'data-index-keyword': indexKeyword,
  //     'data-position-start': `${start}`,
  //     'data-position-end': `${end}`,
  //   },
  // });

export const suggestionsExtension = (): ViewPlugin<PluginValue> => {
  return ViewPlugin.fromClass(
    class {
      decorations: DecorationSet;
      delayedDecorateView: Debouncer<[view: EditorView]>;

      constructor(view: EditorView) {
        this.updateDebouncer(view);
        this.decorations = this.decorateView(view);
      }

      public update(update: ViewUpdate): void {
        if (update.docChanged || update.viewportChanged) {
          this.delayedDecorateView(update.view);
        }
      }

      private updateDebouncer(_view: EditorView) {
        this.delayedDecorateView = debounce(
          (view: EditorView) => {
            this.decorations = this.decorateView(view);
            view.update([]); // force a view update so that the decorations we just set get applied
          },
          1000,
          true
        );
      }

      private decorateView(view: EditorView): DecorationSet {
        const builder = new RangeSetBuilder<Decoration>();
        const entireContent = view.state.doc.toString(); // Use entire document content

        const allPositions = [];

        for (const { from, to } of view.visibleRanges) {
          const content = entireContent.slice(from, to).replace(/(?:__|[*#])|\[(.*?)\]\(.*?\)/gm, '$1');
          const plainAnalysis = nlp(content);

          // Define entity types and corresponding CSS classes
          const entityTypes = {
            places: { data: plainAnalysis.places().json(), class: 'cm-suggestion-candidate-place' },
            people: { data: plainAnalysis.people().json(), class: 'cm-suggestion-candidate-person' },
            organizations: { data: plainAnalysis.organizations().json(), class: 'cm-suggestion-candidate-organization' },
            acronyms: { data: plainAnalysis.acronyms().json(), class: 'cm-suggestion-candidate-acronym' },
            mentions: { data: plainAnalysis.atMentions().json({ normal: true }), class: 'cm-suggestion-candidate-mention' },
          };

          Object.entries(entityTypes).forEach(([entityType, { data, class: entityClass }]) => {
            data.forEach(entity => {
              const searchText = entity.text;
              let searchPos = 0;
              let foundPos;

              while ((foundPos = entireContent.indexOf(searchText, searchPos)) !== -1) {
                const position = { start: foundPos, end: foundPos + searchText.length, class: entityClass, text: searchText };
                allPositions.push(position);
                searchPos = foundPos + searchText.length;
              }
            });
          });
        }

        // Step 1: Sorting positions by start ascending and end descending
        allPositions.sort((a, b) => {
          if (a.start !== b.start) {
            return a.start - b.start; // Ascending by start
          }
          return b.end - a.end; // Descending by end if starts are equal
        });

        // Step 2: Removing duplicates
        const uniquePositions = allPositions.filter((position, index, self) =>
          index === self.findIndex((t) => (
            t.start === position.start && t.end === position.end
          ))
        );

        // Step 3: Removing overlaps
        let cleanPositions = [];
        uniquePositions.forEach(position => {
          if (!cleanPositions.some(existing => position.start < existing.end && existing.start < position.end)) {
            cleanPositions.push(position);
          }
        });
        // console.log("allPositions:",cleanPositions);

        // Adding decorations for each clean position
        cleanPositions.forEach(({ start, end, class: entityClass, text }) => {
          builder.add(start, end, underlineDecoration(start, end, text, entityClass));
        });

        return builder.finish();
      }
    },
    {
      decorations: (view) => view.decorations,

      eventHandlers: {
        mousedown: (e: MouseEvent, view: EditorView) => {
          const target = e.target as HTMLElement;

          // Check if the clicked element is one of our highlighted entities
          if (target.classList.contains("cm-suggestion-candidate-place") ||
              target.classList.contains("cm-suggestion-candidate-person") ||
              target.classList.contains("cm-suggestion-candidate-organization") ||
              target.classList.contains("cm-suggestion-candidate-acronym") ||
              target.classList.contains("cm-suggestion-candidate-mention")) {

            e.preventDefault(); // Prevent any default behavior

            // Extracting the start and end positions from the dataset
            const startPos = Number(target.getAttribute('data-position-start'));
            const endPos = Number(target.getAttribute('data-position-end'));
            const text = target.getAttribute('data-index-keyword');

            if (startPos != null && endPos != null && text) {
              // Preparing the replacement text
              const replacementText = `[[${text}]]`;

              // Dispatching a transaction to replace the text in the document
              view.dispatch({
                changes: { from: startPos, to: endPos, insert: replacementText }
              });
            }
          }
        },
      },
    }
  );
};
