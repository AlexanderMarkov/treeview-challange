using Microsoft.EntityFrameworkCore;
using System.Collections.Generic;
using System.Text.Json.Serialization;

namespace TreeApi.Models
{
	public class TreeDbContext : DbContext
	{
		public DbSet<Node> Nodes { get; set; }

		public TreeDbContext(DbContextOptions<TreeDbContext> options) : base(options)
		{
		}

		protected override void OnModelCreating(ModelBuilder modelBuilder)
		{
			modelBuilder.Entity<Node>()
				.HasOne(x => x.Parent)
				.WithMany(x => x.Children)
				.HasForeignKey(x => x.ParentId);
		}
	}

	public class Node
	{
		public int Id { get; set; }
		public int? ParentId { get; set; }
		public string Name { get; set; }
		public bool IsRemoved { get; set; }

		[JsonIgnore]
		public Node Parent { get; set; }
		public HashSet<Node> Children { get; set; } = new HashSet<Node>();
	}
}
