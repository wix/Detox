package com.example.detox.purenative

import android.view.LayoutInflater
import android.view.ViewGroup
import android.widget.TextView
import androidx.recyclerview.widget.RecyclerView
import androidx.recyclerview.widget.RecyclerView.Adapter
import com.example.detox.purenative.utils.RainbowColors

private const val LIST_SIZE = 180
private val colorsProvider = RainbowColors(LIST_SIZE)

class ListVH internal constructor(parent: ViewGroup)
    : RecyclerView.ViewHolder(LayoutInflater.from(parent.context).inflate(R.layout.actions_rv_item, parent, false)) {

    private val textView
        get() = itemView.findViewById<TextView>(R.id.actions_rv_item_text)

    fun bindTo(position: Int) {
        with(textView) {
            text = "Item @ position #${position + 1}"
            setTextColor(colorsProvider.getColor(position))
        }
    }
}

class DetoxRVAdapter : Adapter<ListVH>() {
    override fun getItemCount() = LIST_SIZE
    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int) = ListVH(parent)
    override fun onBindViewHolder(holder: ListVH, position: Int) {
        holder.bindTo(position)
    }
}
