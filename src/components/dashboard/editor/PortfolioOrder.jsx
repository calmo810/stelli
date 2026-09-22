import React from 'react';
import { DragDropContext, Draggable, Droppable } from '@hello-pangea/dnd';
import { ArrowUpToLine, GripVertical, Loader2, Upload, X } from 'lucide-react';
import { ACCEPT_ATTR } from '@/lib/imageQuality';

export default function PortfolioOrder({ images = [], warnings = {}, onReorder, onPin, onRemove, onUpload, uploading }) {
  const handleDragEnd = (result) => {
    if (!result.destination || result.destination.index === result.source.index) return;
    const next = Array.from(images);
    const [moved] = next.splice(result.source.index, 1);
    next.splice(result.destination.index, 0, moved);
    onReorder(next);
  };

  return (
    <div>
      <div className="flex items-baseline justify-between gap-3 mb-3">
        <p className="label-mono text-[9px] text-white/40">Portfolio order</p>
        <p className="label-mono text-[9px] text-white/25">Drag · first three lead</p>
      </div>

      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="portfolio" direction="horizontal">
          {(provided) => (
            <div ref={provided.innerRef} {...provided.droppableProps} className="flex gap-3 overflow-x-auto pb-2 no-scrollbar">
              {images.map((url, index) => (
                <Draggable key={url} draggableId={url} index={index}>
                  {(drag) => (
                    <div
                      ref={drag.innerRef}
                      {...drag.draggableProps}
                      className="relative shrink-0 w-[132px]"
                    >
                      <div className="relative overflow-hidden border" style={{ borderColor: index < 3 ? 'rgba(255,255,255,0.28)' : 'rgba(255,255,255,0.1)', borderRadius: 3 }}>
                        <img src={url} alt="" className="w-[132px] h-[132px] object-cover" />
                        {index < 3 && (
                          <span
                            className="absolute top-2 left-2 label-mono text-[9px] font-semibold"
                            style={{ color: 'hsl(var(--neon-lime))' }}
                          >
                            {String(index + 1).padStart(2, '0')}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center justify-between mt-2">
                        <span {...drag.dragHandleProps} className="text-white/30 hover:text-white/60 cursor-grab" title="Drag to reorder">
                          <GripVertical className="w-3.5 h-3.5" />
                        </span>
                        {index >= 3 && (
                          <button onClick={() => onPin(index)} className="text-white/30 hover:text-white/70" title="Move to front">
                            <ArrowUpToLine className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button onClick={() => onRemove(index)} className="text-white/30 hover:text-white/70" title="Remove">
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {warnings[url] && (
                        <p className="font-body text-[10px] leading-snug text-white/35 mt-1">{warnings[url]}</p>
                      )}
                    </div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}

              <label className="shrink-0 w-[132px] h-[132px] flex flex-col items-center justify-center gap-2 border border-dashed cursor-pointer" style={{ borderColor: 'rgba(255,255,255,0.18)', borderRadius: 3 }}>
                {uploading ? <Loader2 className="w-4 h-4 animate-spin text-white/40" /> : <Upload className="w-4 h-4 text-white/40" />}
                <span className="label-mono text-[8px] text-white/30">Add</span>
                <input type="file" multiple accept={ACCEPT_ATTR} onChange={onUpload} className="hidden" />
              </label>
            </div>
          )}
        </Droppable>
      </DragDropContext>
    </div>
  );
}