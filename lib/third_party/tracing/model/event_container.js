/**
Copyright (c) 2015 The Chromium Authors. All rights reserved.
Use of this source code is governed by a BSD-style license that can be
found in the LICENSE file.
**/

require("../base/base.js");
require("../base/guid.js");
require("../base/range.js");

'use strict';

global.tr.exportTo('tr.model', function() {

  /**
   * EventContainer is a base class for any class in the trace model that
   * contains child events or child EventContainers.
   *
   * For all EventContainers, updateBounds() must be called after modifying the
   * container's events if an up-to-date bounds is expected.
   *
   * @constructor
   */
  function EventContainer() {
    this.guid_ = tr.b.GUID.allocate();
    this.important = true;
    this.bounds_ = new tr.b.Range();
  }

  EventContainer.prototype = {
    get guid() {
      return this.guid_;
    },

    /**
     * @return {String} A stable and unique identifier that describes this
     * container's position in the event tree relative to the root. If an event
     * container 'B' is a child to another event container 'A', then container
     * B's stable ID would be 'A.B'.
     */
    get stableId() {
      throw new Error('Not implemented');
    },

    /**
     * Returns the bounds of the event container, which describe the range
     * of timestamps for all ancestor events.
     */
    get bounds() {
      return this.bounds_;
    },

    // TODO(charliea): A default implementation of this method could likely be
    // provided that uses 'iterateAllEvents'.
    /**
     * Updates the bounds of the event container. After updating, this.bounds
     * will describe the range of timestamps of all ancestor events.
     */
    updateBounds: function() {
      throw new Error('Not implemented');
    },

    // TODO(charliea): A default implementation of this method could likely be
    // provided that uses 'iterateAllEvents'.
    /**
     * Shifts the timestamps for ancestor events by 'amount' milliseconds.
     */
    shiftTimestampsForward: function(amount) {
      throw new Error('Not implemented');
    },

    /**
     * Iterates over all child events.
     */
    iterateAllEventsInThisContainer: function(eventTypePredicate,
                                              callback, opt_this) {
      throw new Error('Not implemented');
    },

    /**
     * Iterates over all child containers.
     */
    iterateAllChildEventContainers: function(callback, opt_this) {
      throw new Error('Not implemented');
    },

    /**
     * Iterates over all ancestor events.
     */
    iterateAllEvents: function(callback, opt_this) {
      this.iterateAllEventContainers(function(ec) {
        ec.iterateAllEventsInThisContainer(
            function(eventType) { return true; },
            callback, opt_this);
      });
    },

    /**
     * Iterates over this container and all ancestor containers.
     */
    iterateAllEventContainers: function(callback, opt_this) {
      function visit(ec) {
        callback.call(opt_this, ec);
        ec.iterateAllChildEventContainers(visit);
      }
      visit(this);
    }
  };

  return {
    EventContainer: EventContainer
  };
});
