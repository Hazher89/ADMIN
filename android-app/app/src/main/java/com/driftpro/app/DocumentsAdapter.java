package com.driftpro.app;

import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.ImageView;
import android.widget.TextView;
import androidx.annotation.NonNull;
import androidx.recyclerview.widget.RecyclerView;
import java.util.List;

public class DocumentsAdapter extends RecyclerView.Adapter<DocumentsAdapter.DocumentViewHolder> {
    private List<Document> documents;
    private OnDocumentClickListener listener;

    public interface OnDocumentClickListener {
        void onDocumentClick(Document document);
    }

    public DocumentsAdapter(List<Document> documents, OnDocumentClickListener listener) {
        this.documents = documents;
        this.listener = listener;
    }

    @NonNull
    @Override
    public DocumentViewHolder onCreateViewHolder(@NonNull ViewGroup parent, int viewType) {
        View view = LayoutInflater.from(parent.getContext())
                .inflate(R.layout.item_document, parent, false);
        return new DocumentViewHolder(view);
    }

    @Override
    public void onBindViewHolder(@NonNull DocumentViewHolder holder, int position) {
        Document document = documents.get(position);
        holder.bind(document);
    }

    @Override
    public int getItemCount() {
        return documents.size();
    }

    public void updateDocuments(List<Document> newDocuments) {
        this.documents = newDocuments;
        notifyDataSetChanged();
    }

    class DocumentViewHolder extends RecyclerView.ViewHolder {
        private ImageView fileIcon;
        private TextView title;
        private TextView description;
        private TextView category;
        private TextView fileSize;
        private TextView uploadedBy;

        public DocumentViewHolder(@NonNull View itemView) {
            super(itemView);
            fileIcon = itemView.findViewById(R.id.document_file_icon);
            title = itemView.findViewById(R.id.document_title);
            description = itemView.findViewById(R.id.document_description);
            category = itemView.findViewById(R.id.document_category);
            fileSize = itemView.findViewById(R.id.document_file_size);
            uploadedBy = itemView.findViewById(R.id.document_uploaded_by);

            itemView.setOnClickListener(v -> {
                int position = getAdapterPosition();
                if (position != RecyclerView.NO_POSITION && listener != null) {
                    listener.onDocumentClick(documents.get(position));
                }
            });
        }

        public void bind(Document document) {
            title.setText(document.getTitle());
            description.setText(document.getDescription());
            category.setText(document.getCategoryDisplayName());
            fileSize.setText(document.getFileSizeFormatted());
            uploadedBy.setText("Lastet opp av " + document.getUploadedBy());

            // Set file icon based on file type
            String fileType = document.getFileType().toLowerCase();
            if (fileType.contains("pdf")) {
                fileIcon.setImageResource(R.drawable.ic_pdf);
                fileIcon.setColorFilter(itemView.getContext().getResources().getColor(R.color.red));
            } else if (fileType.contains("doc") || fileType.contains("docx")) {
                fileIcon.setImageResource(R.drawable.ic_word);
                fileIcon.setColorFilter(itemView.getContext().getResources().getColor(R.color.blue));
            } else if (fileType.contains("xls") || fileType.contains("xlsx")) {
                fileIcon.setImageResource(R.drawable.ic_excel);
                fileIcon.setColorFilter(itemView.getContext().getResources().getColor(R.color.green));
            } else if (fileType.contains("ppt") || fileType.contains("pptx")) {
                fileIcon.setImageResource(R.drawable.ic_powerpoint);
                fileIcon.setColorFilter(itemView.getContext().getResources().getColor(R.color.orange));
            } else {
                fileIcon.setImageResource(R.drawable.ic_document);
                fileIcon.setColorFilter(itemView.getContext().getResources().getColor(R.color.gray));
            }
        }
    }
} 