package com.wix.detox.common.collect

import java.lang.IllegalStateException

class PairsIterator<T>(private val delegate: Iterator<T>): Iterator<Pair<T, T>> {
    constructor(iterable: Iterable<T>): this(iterable.iterator())

    override fun hasNext(): Boolean = delegate.hasNext()
    override fun next(): Pair<T, T> {
        val next = delegate.next()
        if (!delegate.hasNext()) {
            throw IllegalStateException("Uneven iterator content!")
        }

        val nextNext = delegate.next()
        return Pair(next, nextNext)
    }
}
