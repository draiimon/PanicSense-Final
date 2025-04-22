{
        accessorKey: "sentiment",
        header: "Sentiment",
        cell: ({ row }) => (
          <div className="flex flex-col gap-1">
            <Badge
              variant="outline"
              className={`${getSentimentBadgeClasses(row.getValue("sentiment"))}`}
            >
              {row.getValue("sentiment")}
            </Badge>
            {row.original.explanation && (
              <div className="text-xs text-slate-500 max-w-[250px] truncate" title={row.original.explanation}>
                {row.original.explanation}
              </div>
            )}
          </div>
        ),
      },